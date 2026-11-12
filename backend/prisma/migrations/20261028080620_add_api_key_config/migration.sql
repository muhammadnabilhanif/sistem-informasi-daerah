-- AlterTable
ALTER TABLE `ai_settings` ADD COLUMN `apiKeyConfig` JSON NULL,
    MODIFY `aiModel` VARCHAR(191) NOT NULL DEFAULT 'gemini-2.5-flash';
