-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReviewEntityType" AS ENUM ('TOWER', 'LEG', 'STAY', 'FOUNDATION', 'LOCATION');

-- CreateTable
CREATE TABLE "review_items" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "entityType" "ReviewEntityType" NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "parsedRecordId" TEXT,
    "rejectionReason" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_fields" (
    "id" TEXT NOT NULL,
    "reviewItemId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "extractedValue" TEXT NOT NULL,
    "parsedValue" JSONB,
    "humanValue" JSONB,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "overridden" BOOLEAN NOT NULL DEFAULT false,
    "inspected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "review_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_audit_entries" (
    "id" TEXT NOT NULL,
    "reviewFieldId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousValue" JSONB,
    "newValue" JSONB,
    "justification" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_audit_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "review_fields_reviewItemId_key_key" ON "review_fields"("reviewItemId", "key");

-- AddForeignKey
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_workId_fkey" FOREIGN KEY ("workId") REFERENCES "works"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_fields" ADD CONSTRAINT "review_fields_reviewItemId_fkey" FOREIGN KEY ("reviewItemId") REFERENCES "review_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_audit_entries" ADD CONSTRAINT "review_audit_entries_reviewFieldId_fkey" FOREIGN KEY ("reviewFieldId") REFERENCES "review_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;
