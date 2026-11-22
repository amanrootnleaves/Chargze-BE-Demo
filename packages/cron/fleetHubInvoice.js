import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const run = async () => {
  console.log("[FleetHubInvoice Cron] Starting invoice generation...");

  try {
    // 1. Unbilled aur completed sessions fetch karein with nested relations
    const unbilledSessions = await prisma.chargingSession.findMany({
      where: {
        fleetHubInvoice__fk__: null,
        status: "COMPLETED",
        isDeleted: false,
        RfidTag: {
          fleetOwner__fk__: { not: null },
        },
      },
      select: {
        id: true,
        totalAmount: true,
        energyConsumed: true,
        Charger: {
          select: {
            ChargingStation__fk__: true,
          },
        },
        RfidTag: {
          select: {
            fleetOwner__fk__: true,
          },
        },
      },
    });

    if (!unbilledSessions.length) {
      console.log("[FleetHubInvoice Cron] No unbilled sessions found.");
      return;
    }

    // 2. Group by FleetOwner & ChargingStation
    const grouped = {};
    for (const session of unbilledSessions) {
      const fleetOwnerId = session.RfidTag?.fleetOwner__fk__;
      const chargingStationId = session.Charger?.ChargingStation__fk__;

      if (!fleetOwnerId || !chargingStationId) continue;

      const key = `${fleetOwnerId}_${chargingStationId}`;
      if (!grouped[key]) {
        grouped[key] = {
          fleetOwnerId,
          chargingStationId,
          sessions: [],
          totalEnergy: 0,
          subtotal: 0,
        };
      }
      grouped[key].sessions.push(session.id);
      grouped[key].totalEnergy += Number(session.energyConsumed || 0);
      grouped[key].subtotal += Number(session.totalAmount || 0);
    }

    // 3. Billing Period & Dates
    const now = new Date();
    const billingStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const billingEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const dueDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const billingPeriod = now.toLocaleString("default", { month: "long", year: "numeric" });

    // 4. Invoices create karein aur sessions link karein
    for (const key of Object.keys(grouped)) {
      const item = grouped[key];
      const gstAmount = Number((item.subtotal * 0.18).toFixed(2));
      const totalAmount = Number((item.subtotal + gstAmount).toFixed(2));
      const invoiceNumber = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      await prisma.$transaction(async (tx) => {
        // Check if invoice already exists for this fleet + station + period
        const existingInvoice = await tx.fleetHubInvoice.findFirst({
          where: {
            fleetOwner__fk__: item.fleetOwnerId,
            chargingStation__fk__: item.chargingStationId,
            billingPeriod,
          },
        });

        if (existingInvoice) {
          // Link unlinked sessions to the existing invoice
          await tx.chargingSession.updateMany({
            where: { id: { in: item.sessions } },
            data: { fleetHubInvoice__fk__: existingInvoice.id },
          });
          console.log(`[FleetHubInvoice Cron] Linked ${item.sessions.length} sessions to existing invoice ${existingInvoice.invoiceNumber}`);
          return;
        }

        const invoice = await tx.fleetHubInvoice.create({
          data: {
            invoiceNumber,
            fleetOwner__fk__: item.fleetOwnerId,
            chargingStation__fk__: item.chargingStationId,
            billingPeriod,
            billingStartDate,
            billingEndDate,
            dueDate,
            totalSessions: item.sessions.length,
            totalEnergy: item.totalEnergy,
            subtotal: item.subtotal,
            gstAmount,
            totalAmount,
            status: "PENDING",
          },
        });

        await tx.chargingSession.updateMany({
          where: { id: { in: item.sessions } },
          data: { fleetHubInvoice__fk__: invoice.id },
        });

        console.log(`[FleetHubInvoice Cron] Created Invoice ${invoice.invoiceNumber} for FleetOwner ${item.fleetOwnerId}`);
      });
    }

    console.log("[FleetHubInvoice Cron] Job finished successfully.");
  } catch (error) {
    console.error("[FleetHubInvoice Cron] Error:", error);
  } finally {
    await prisma.$disconnect();
  }
};

run();