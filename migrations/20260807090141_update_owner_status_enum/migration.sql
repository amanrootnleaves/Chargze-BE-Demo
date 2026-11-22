/*
  Warnings:

  - The values [COMPLETED,INCOMPLETE,CLOSED] on the enum `OWNER_STATUS` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OWNER_STATUS_new" AS ENUM ('ACTIVE', 'INACTIVE');
ALTER TABLE "StationOwner" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "StationOwner" ALTER COLUMN "status" TYPE "OWNER_STATUS_new" USING ("status"::text::"OWNER_STATUS_new");
ALTER TYPE "OWNER_STATUS" RENAME TO "OWNER_STATUS_old";
ALTER TYPE "OWNER_STATUS_new" RENAME TO "OWNER_STATUS";
DROP TYPE "OWNER_STATUS_old";
ALTER TABLE "StationOwner" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterTable
ALTER TABLE "StationOwner" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
