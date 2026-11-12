-- AlterTable
ALTER TABLE `ai_conversations` MODIFY `title` VARCHAR(255) NOT NULL DEFAULT 'New Conversation';

-- AlterTable
ALTER TABLE `ai_messages` MODIFY `content` TEXT NOT NULL;
