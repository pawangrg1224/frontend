-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "tokenNumber" INTEGER;

-- CreateIndex
CREATE INDEX "Appointment_serviceId_date_status_idx" ON "Appointment"("serviceId", "date", "status");
