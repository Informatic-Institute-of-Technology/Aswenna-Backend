import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Meta } from 'src/common/schemas/meta.schema';
import { Permission } from 'src/modules/permission/schemas/permission.schema';
import { Role } from 'src/modules/role/schemas/role.schema';

@Schema({ timestamps: true })
export class User extends Document {
  declare readonly _id: Types.ObjectId;

  @Prop()
  readonly firstName: string;

  @Prop()
  readonly lastName: string;

  @Prop()
  readonly fullName: string;

  @Prop()
  readonly address: string;

  @Prop()
  readonly email: string;

  @Prop({ default: false })
  readonly emailVerified: boolean;

  @Prop()
  readonly phoneNumber: string;

  @Prop({ default: false })
  readonly phoneNumberVerified: boolean;

  @Prop({ select: false })
  readonly password: string;

  @Prop()
  readonly profilePicture: string;

  @Prop({ type: Types.ObjectId, ref: Role.name })
  readonly role: Role;

  @Prop({ type: [Types.ObjectId], ref: Permission.name })
  readonly permissions: Permission[];

  @Prop([Meta])
  readonly meta: Meta[];

  @Prop({ default: 'system' })
  readonly createdBy: string;

  @Prop(Date)
  readonly createdAt: Date;

  @Prop({ default: 'system' })
  readonly updatedBy: string;

  @Prop(Date)
  readonly updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
