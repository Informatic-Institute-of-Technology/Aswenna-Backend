import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Meta } from 'src/common/schemas/meta.schema';
import { Permission } from 'src/modules/permission/schemas/permission.schema';
import { Role } from 'src/modules/role/schemas/role.schema';

export class PersonalInfo {
  @Prop({ default: null })
  readonly profilePicture?: string;

  @Prop()
  readonly nicNumber: string;

  @Prop()
  readonly birthday: Date;

  @Prop()
  readonly gender: string;

  @Prop()
  readonly age: number;

  @Prop()
  readonly province: string;

  @Prop()
  readonly district: string;

  @Prop()
  readonly postalCode: string;

  @Prop()
  readonly address: string;

  @Prop()
  readonly nicFrontImage: string;

  @Prop()
  readonly nicBackImage: string;
}

@Schema({ timestamps: true })
export class User extends Document {
  declare readonly _id: Types.ObjectId;

  @Prop()
  readonly fullName: string;

  @Prop({ unique: true, sparse: true })
  readonly email: string;

  @Prop({ default: false })
  readonly emailVerified: boolean;

  @Prop({ unique: true, sparse: true })
  readonly phoneNumber: string;

  @Prop({ default: false })
  readonly phoneNumberVerified: boolean;

  @Prop({ select: false })
  readonly password: string;

  @Prop({ type: PersonalInfo, default: () => ({}) })
  readonly personalInfo: PersonalInfo;

  @Prop({ default: false })
  readonly termsAccepted: boolean;

  @Prop()
  readonly termsAcceptedAt: Date;

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
