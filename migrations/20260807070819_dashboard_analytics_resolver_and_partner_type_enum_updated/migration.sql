/*
  Warnings:

  - The values [FOFO,COCO] on the enum `PARTNER_TYPE` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PARTNER_TYPE_new" AS ENUM ('FRANCHISE', 'DIRECT');
ALTER TABLE "StationOwner" ALTER COLUMN "partnerType" TYPE "PARTNER_TYPE_new" USING ("partnerType"::text::"PARTNER_TYPE_new");
ALTER TYPE "PARTNER_TYPE" RENAME TO "PARTNER_TYPE_old";
ALTER TYPE "PARTNER_TYPE_new" RENAME TO "PARTNER_TYPE";
DROP TYPE "PARTNER_TYPE_old";
COMMIT;
