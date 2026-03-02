import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { File } from 'src/common/schemas/file.schema';
import { Meta } from 'src/common/schemas/meta.schema';
import { Permission } from 'src/modules/permission/schemas/permission.schema';
import { Role } from 'src/modules/role/schemas/role.schema';

export enum UserStatus {
  PENDING = 'PENDING',
  Active = 'Active',
  Inactive = 'Inactive',
  Suspended = 'Suspended',
}

export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other',
}

export enum UserImageTarget {
  PROFILE_PICTURE = 'profilePicture',
  NIC_FRONT = 'nicFrontImage',
  NIC_BACK = 'nicBackImage',
  GOVIJANA_SEVA_PASSBOOK = 'GovijanaSevaPassbookImage',
  GN_CERTIFICATE = 'gnCertificateImage',
  BIMSAVIYA_CERTIFICATE = 'bimsaviyaCertificate',
  LAND_IMAGES = 'landImages',
}

@Schema({ timestamps: false, _id: false })
export class PersonalInfo {
  @Prop(File)
  readonly profilePicture: File;

  @Prop()
  readonly nicNumber: string;

  @Prop({ enum: Gender })
  readonly gender: Gender;

  @Prop(Date)
  readonly birthday: Date;

  @Prop()
  readonly age: number;

  @Prop()
  readonly address: string;

  @Prop()
  readonly city: string;

  @Prop()
  readonly province: string;

  @Prop()
  readonly postalCode: string;

  @Prop()
  readonly district: string;

  @Prop(File)
  readonly nicFrontImage: File;

  @Prop(File)
  readonly nicBackImage: File;
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

  @Prop(Date)
  readonly termsAcceptedAt: Date;

  @Prop({ enum: UserStatus, default: UserStatus.PENDING })
  readonly status: UserStatus;

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
