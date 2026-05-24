-- CreateEnum
CREATE TYPE "WorkStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WorkTowerStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'CALCULATED', 'EMITTED');

-- CreateEnum
CREATE TYPE "WorkDocumentPipelineStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'PENDING_REVIEW', 'REVIEWED', 'FAILED');

-- CreateTable
CREATE TABLE "works" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "description" TEXT,
    "status" "WorkStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "works_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_towers" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "towerId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "alias" TEXT,
    "status" "WorkTowerStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_towers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_documents" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" "DocumentType" NOT NULL,
    "storageKey" TEXT,
    "pipelineStatus" "WorkDocumentPipelineStatus" NOT NULL DEFAULT 'UPLOADED',
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "work_towers_workId_sequence_key" ON "work_towers"("workId", "sequence");

-- AddForeignKey
ALTER TABLE "works" ADD CONSTRAINT "works_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_towers" ADD CONSTRAINT "work_towers_workId_fkey" FOREIGN KEY ("workId") REFERENCES "works"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_towers" ADD CONSTRAINT "work_towers_towerId_fkey" FOREIGN KEY ("towerId") REFERENCES "towers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_documents" ADD CONSTRAINT "work_documents_workId_fkey" FOREIGN KEY ("workId") REFERENCES "works"("id") ON DELETE CASCADE ON UPDATE CASCADE;
