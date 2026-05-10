-- AlterTable
ALTER TABLE "DoctorProfile" ADD COLUMN     "departmentId" TEXT,
ADD COLUMN     "experience" INTEGER,
ADD COLUMN     "profileImage" TEXT,
ADD COLUMN     "qualifications" TEXT[];

-- AddForeignKey
ALTER TABLE "DoctorProfile" ADD CONSTRAINT "DoctorProfile_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
