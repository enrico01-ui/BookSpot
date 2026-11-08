-- CreateEnum
CREATE TYPE "ResourceSetting" AS ENUM ('INDOOR', 'OUTDOOR');

-- AlterTable
ALTER TABLE "resources" ADD COLUMN     "setting" "ResourceSetting";
