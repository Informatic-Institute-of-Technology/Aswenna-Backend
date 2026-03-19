import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MessageType } from '../schemas/message.schema';

export class SendMessageDto {
  @IsMongoId()
  conversationId: string;

  @IsString()
  @MaxLength(4000)
  content: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;
}
