-- CreateEnum
CREATE TYPE "TowerClassification" AS ENUM ('SELF_SUPPORTING', 'GUYED');

-- CreateEnum
CREATE TYPE "FoundationKind" AS ENUM ('CAISSON', 'FOOTING');

-- CreateEnum
CREATE TYPE "FoundationTypeCode" AS ENUM ('TM', 'TE', 'TR', 'S', 'SM', 'VE');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('THEORETICAL', 'FIELD', 'RECALCULATED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PDF', 'XLS', 'DWG');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('GUYED_HEIGHT_LOCATION', 'GUYED_FOUNDATION', 'SELF_SUPPORTING_STUBS', 'SELF_SUPPORTING_FOUNDATION');

-- CreateEnum
CREATE TYPE "ExtractionStatus" AS ENUM ('PENDING', 'EXTRACTED', 'VALIDATED', 'COMMITTED', 'REJECTED');

-- CreateTable
CREATE TABLE "project_documents" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "projectType" "ProjectType" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "status" "ExtractionStatus" NOT NULL DEFAULT 'PENDING',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extracted_data" (
    "id" TEXT NOT NULL,
    "projectDocumentId" TEXT NOT NULL,
    "towerParams" JSONB NOT NULL DEFAULT '{}',
    "legs" JSONB NOT NULL DEFAULT '[]',
    "elements" JSONB NOT NULL DEFAULT '[]',
    "userEdits" JSONB NOT NULL DEFAULT '{}',
    "validatedAt" TIMESTAMP(3),
    "validatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extracted_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "towers" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "extension" DECIMAL(8,2) NOT NULL,
    "hu" DECIMAL(8,2) NOT NULL,
    "classification" "TowerClassification" NOT NULL,
    "deflectionDeg" INTEGER,
    "deflectionMin" INTEGER,
    "deflectionSec" DECIMAL(6,4),
    "deflectionDir" TEXT,
    "projectDocumentId" TEXT,
    "dataSource" "DataSource" NOT NULL DEFAULT 'THEORETICAL',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "towers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legs" (
    "id" TEXT NOT NULL,
    "legId" TEXT NOT NULL,
    "towerId" TEXT NOT NULL,
    "foundationKind" "FoundationKind",
    "foundationCatalogRefId" TEXT,
    "foundationGeometry" JSONB,
    "foundationAzimuth" DECIMAL(8,4),
    "naturalElevation" DECIMAL(10,4),
    "concreteCastingElev" DECIMAL(10,4),
    "distance" DECIMAL(10,4),
    "stubType" TEXT,
    "stubLength" DECIMAL(8,4),
    "stubEmbedment" DECIMAL(8,4),
    "stubInclination" DECIMAL(8,4),
    "theoreticalData" JSONB,
    "fieldData" JSONB,
    "dataSource" "DataSource" NOT NULL DEFAULT 'THEORETICAL',

    CONSTRAINT "legs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guyed_elements" (
    "id" TEXT NOT NULL,
    "elementId" TEXT NOT NULL,
    "towerId" TEXT NOT NULL,
    "foundationKind" "FoundationKind",
    "foundationCatalogRefId" TEXT,
    "foundationGeometry" JSONB,
    "foundationAzimuth" DECIMAL(8,4),
    "naturalElevation" DECIMAL(10,4),
    "concreteCastingElev" DECIMAL(10,4),
    "distance" DECIMAL(10,4),
    "stayHorizAngleDeg" INTEGER,
    "stayHorizAngleMin" INTEGER,
    "stayHorizAngleSec" DECIMAL(6,4),
    "stayInclinationAngle" DECIMAL(8,4),
    "stubType" TEXT,
    "stubLength" DECIMAL(8,4),
    "stubEmbedment" DECIMAL(8,4),
    "theoreticalData" JSONB,
    "fieldData" JSONB,
    "dataSource" "DataSource" NOT NULL DEFAULT 'THEORETICAL',

    CONSTRAINT "guyed_elements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foundation_catalog_items" (
    "id" TEXT NOT NULL,
    "catalogRefId" TEXT NOT NULL,
    "kind" "FoundationKind" NOT NULL,
    "typeCode" "FoundationTypeCode" NOT NULL,
    "geometry" JSONB NOT NULL,
    "reinforcement" JSONB,
    "loadCapacity" JSONB,
    "description" TEXT,

    CONSTRAINT "foundation_catalog_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "legs_towerId_legId_key" ON "legs"("towerId", "legId");

-- CreateIndex
CREATE UNIQUE INDEX "guyed_elements_towerId_elementId_key" ON "guyed_elements"("towerId", "elementId");

-- CreateIndex
CREATE UNIQUE INDEX "foundation_catalog_items_catalogRefId_key" ON "foundation_catalog_items"("catalogRefId");

-- AddForeignKey
ALTER TABLE "extracted_data" ADD CONSTRAINT "extracted_data_projectDocumentId_fkey" FOREIGN KEY ("projectDocumentId") REFERENCES "project_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "towers" ADD CONSTRAINT "towers_projectDocumentId_fkey" FOREIGN KEY ("projectDocumentId") REFERENCES "project_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legs" ADD CONSTRAINT "legs_towerId_fkey" FOREIGN KEY ("towerId") REFERENCES "towers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guyed_elements" ADD CONSTRAINT "guyed_elements_towerId_fkey" FOREIGN KEY ("towerId") REFERENCES "towers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
