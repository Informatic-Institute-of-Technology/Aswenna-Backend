import { IsMongoId } from 'class-validator';

export class CreateDirectConversationDto {
  @IsMongoId()
  peerUserId: string;
}
