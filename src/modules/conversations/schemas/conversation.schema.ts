import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/modules/user/schemas/user.schema';

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
}

export enum ConversationMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Schema({ _id: false })
export class ConversationMember {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ConversationMemberRole,
    default: ConversationMemberRole.MEMBER,
  })
  role: ConversationMemberRole;

  @Prop({ type: Date, default: Date.now })
  joinedAt: Date;
}

const ConversationMemberSchema =
  SchemaFactory.createForClass(ConversationMember);

@Schema({ timestamps: true })
export class Conversation extends Document {
  declare readonly _id: Types.ObjectId;

  @Prop({ type: String, enum: ConversationType, required: true, index: true })
  type: ConversationType;

  @Prop({ trim: true, maxlength: 120 })
  name?: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  createdBy: Types.ObjectId;

  @Prop({ type: [ConversationMemberSchema], default: [] })
  members: ConversationMember[];

  @Prop({ maxlength: 4000 })
  lastMessageText?: string;

  @Prop({ type: Date })
  lastMessageAt?: Date;

  @Prop({ type: String, unique: true, sparse: true })
  directKey?: string;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

ConversationSchema.index({ 'members.userId': 1, updatedAt: -1 });
ConversationSchema.index(
  { type: 1, directKey: 1 },
  { unique: true, sparse: true },
);
