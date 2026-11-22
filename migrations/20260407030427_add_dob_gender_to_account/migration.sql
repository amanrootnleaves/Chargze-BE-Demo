-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "gender" TEXT;

-- AddForeignKey
ALTER TABLE "Scope" ADD CONSTRAINT "Scope_Account__fk___fkey" FOREIGN KEY ("Account__fk__") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
