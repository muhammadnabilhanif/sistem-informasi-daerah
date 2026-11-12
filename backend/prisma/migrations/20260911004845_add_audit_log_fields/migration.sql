-- AlterTable
ALTER TABLE `audit_logs` ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `durationMs` INTEGER NULL,
    ADD COLUMN `errorMessage` VARCHAR(191) NULL,
    ADD COLUMN `statusCode` INTEGER NULL;
