-- CreateEnum
CREATE TYPE "OwnerProfileStatus" AS ENUM ('COMPLETED', 'INCOMPLETE', 'CLOSED');

-- AlterTable
ALTER TABLE "StationOwner" ADD COLUMN     "profileStatus" "OwnerProfileStatus" NOT NULL DEFAULT 'INCOMPLETE';
