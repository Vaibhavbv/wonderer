-- AlterTable
ALTER TABLE "trip_locations" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "theme" JSONB;

-- AlterTable
ALTER TABLE "media" ADD COLUMN     "location_id" TEXT;

-- CreateIndex
CREATE INDEX "media_location_id_idx" ON "media"("location_id");

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "trip_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
