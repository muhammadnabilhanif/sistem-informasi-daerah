import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class ChatDto {
  @IsString()
  @IsNotEmpty({ message: 'Pesan tidak boleh kosong' })
  message: string;

  @IsUUID()
  @IsOptional()
  conversationId?: string;

  @IsUUID()
  @IsOptional()
  villageId?: string;

  @IsString()
  @IsOptional()
  model?: string;
}

export class ClearConversationDto {
  @IsUUID()
  @IsNotEmpty()
  conversationId: string;
}