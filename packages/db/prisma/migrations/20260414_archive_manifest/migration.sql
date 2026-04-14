-- AlterTable
ALTER TABLE "HoneypotSession"
ADD COLUMN     "archiveManifestId" TEXT,
ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ArchiveManifest" (
    "id" TEXT NOT NULL,
    "archiveSizeBytes" INTEGER NOT NULL,
    "bucket" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "format" TEXT NOT NULL DEFAULT 'jsonl.gz',
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "requestCount" INTEGER NOT NULL,
    "sessionCount" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,

    CONSTRAINT "ArchiveManifest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArchiveManifest_storageKey_key" ON "ArchiveManifest"("storageKey");

-- CreateIndex
CREATE INDEX "ArchiveManifest_createdAt_idx" ON "ArchiveManifest"("createdAt");

-- CreateIndex
CREATE INDEX "HoneypotSession_archiveManifestId_idx" ON "HoneypotSession"("archiveManifestId");

-- CreateIndex
CREATE INDEX "HoneypotSession_archivedAt_idx" ON "HoneypotSession"("archivedAt");

-- AddForeignKey
ALTER TABLE "HoneypotSession" ADD CONSTRAINT "HoneypotSession_archiveManifestId_fkey" FOREIGN KEY ("archiveManifestId") REFERENCES "ArchiveManifest"("id") ON DELETE SET NULL ON UPDATE CASCADE;