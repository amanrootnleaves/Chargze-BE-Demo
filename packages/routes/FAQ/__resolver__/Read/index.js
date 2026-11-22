export default async (__, args, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> FAQ -> Query -> GetFAQs";

      await Context.Debug(
        {
          message: "Fetching FAQs.",
        },
        _functionName,
      );
      let category = args.category ?? "GENERAL";

      const faqs = await Context.DataBase.faq.findMany({
        where: {
          isDeleted: false,
          isActive: true,
          category,
        },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      });

      await Context.Debug(
        {
          message: `Fetched ${faqs.length} FAQs.`,
        },
        _functionName,
      );

      return faqs;
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
