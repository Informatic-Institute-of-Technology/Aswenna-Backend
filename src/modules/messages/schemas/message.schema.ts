import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Conversation } from 'src/modules/conversations/schemas/conversation.schema';
import { User } from 'src/modules/user/schemas/user.schema';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
}

@Schema({ _id: false })
export class MessageReadBy {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  readAt: Date;
}

const MessageReadBySchema = SchemaFactory.createForClass(MessageReadBy);

@Schema({ timestamps: true })
export class Message extends Document {
  declare readonly _id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: Conversation.name,
    required: true,
    index: true,
  })
  conversationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  senderId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, maxlength: 4000 })
  content: string;

  @Prop({ type: String, enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @Prop({ type: [MessageReadBySchema], default: [] })
  readBy: MessageReadBy[];

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ 'readBy.userId': 1 });
