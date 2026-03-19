import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ConversationMemberRole } from '../schemas/conversation.schema';

export class CreateGroupConversationDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsMongoId({ each: true })
  memberIds: string[];
}

export class AddConversationMemberDto {
  @IsMongoId()
  userId: string;

  @IsOptional()
  @IsEnum(ConversationMemberRole)
  role?: ConversationMemberRole;
}
