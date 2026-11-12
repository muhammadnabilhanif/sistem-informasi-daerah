-- CreateTable
CREATE TABLE `resident_statistics` (
    `id` VARCHAR(191) NOT NULL,
    `villageId` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `semester` INTEGER NOT NULL DEFAULT 1,
    `totalPopulation` INTEGER NOT NULL DEFAULT 0,
    `maleCount` INTEGER NOT NULL DEFAULT 0,
    `femaleCount` INTEGER NOT NULL DEFAULT 0,
    `totalHouseholds` INTEGER NOT NULL DEFAULT 0,
    `totalFamilies` INTEGER NOT NULL DEFAULT 0,
    `ageGroups` JSON NULL,
    `educationStats` JSON NULL,
    `occupationStats` JSON NULL,
    `religionStats` JSON NULL,
    `dataSource` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `resident_statistics_villageId_year_semester_key`(`villageId`, `year`, `semester`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `resident_statistics` ADD CONSTRAINT `resident_statistics_villageId_fkey` FOREIGN KEY (`villageId`) REFERENCES `villages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
