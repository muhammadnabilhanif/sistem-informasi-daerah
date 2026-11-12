-- CreateTable
CREATE TABLE `ai_settings` (
    `id` VARCHAR(191) NOT NULL,
    `aiName` VARCHAR(191) NOT NULL DEFAULT 'Asisten Desa',
    `tone` VARCHAR(191) NOT NULL DEFAULT 'FORMAL',
    `customPrompt` TEXT NULL,
    `aiModel` VARCHAR(191) NOT NULL DEFAULT 'gemini-3.8-flash',
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
