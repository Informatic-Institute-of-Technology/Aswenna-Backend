import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MessageType } from 'src/modules/messages/schemas/message.schema';

export class JoinConversationEventDto {
  @IsMongoId()
  conversationId: string;
}

export class TypingEventDto {
  @IsMongoId()
  conversationId: string;
}

export class ReadReceiptEventDto {
  @IsMongoId()
  conversationId: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  messageIds?: string[];
}

export class SendMessageEventDto {
  @IsMongoId()
  conversationId: string;

  @IsString()
  @MaxLength(4000)
  content: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;
}
