/*
  Warnings:

  - A unique constraint covering the columns `[managedRtId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[managedRwId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `roles` MODIFY `name` ENUM('SUPER_ADMIN', 'VILLAGE_ADMIN', 'CITIZEN', 'RT_ADMIN', 'RW_ADMIN') NOT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `managedRtId` VARCHAR(191) NULL,
    ADD COLUMN `managedRwId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `rws` (
    `id` VARCHAR(191) NOT NULL,
    `villageId` VARCHAR(191) NOT NULL,
    `number` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rws_villageId_number_key`(`villageId`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rts` (
    `id` VARCHAR(191) NOT NULL,
    `rwId` VARCHAR(191) NOT NULL,
    `number` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rts_rwId_number_key`(`rwId`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `users_managedRtId_key` ON `users`(`managedRtId`);

-- CreateIndex
CREATE UNIQUE INDEX `users_managedRwId_key` ON `users`(`managedRwId`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_managedRtId_fkey` FOREIGN KEY (`managedRtId`) REFERENCES `rts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_managedRwId_fkey` FOREIGN KEY (`managedRwId`) REFERENCES `rws`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rws` ADD CONSTRAINT `rws_villageId_fkey` FOREIGN KEY (`villageId`) REFERENCES `villages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rts` ADD CONSTRAINT `rts_rwId_fkey` FOREIGN KEY (`rwId`) REFERENCES `rws`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
