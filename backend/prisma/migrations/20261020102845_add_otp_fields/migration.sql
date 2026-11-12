-- AlterTable
ALTER TABLE `users` ADD COLUMN `isEmailVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `otpExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `verificationCode` VARCHAR(191) NULL;
