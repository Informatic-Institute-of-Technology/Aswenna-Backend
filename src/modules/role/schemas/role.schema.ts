import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Meta } from 'src/common/schemas/meta.schema';
import { Permission } from 'src/modules/permission/schemas/permission.schema';

@Schema({ timestamps: true })
export class Role extends Document {
  declare readonly _id: string;

  @Prop()
  readonly name: string;

  @Prop()
  readonly description: string;

  @Prop({ type: [Types.ObjectId], ref: Permission.name })
  readonly permissions: Permission[];

  @Prop([Meta])
  readonly meta: Meta[];

  @Prop()
  readonly createdBy: string;

  @Prop(Date)
  readonly createdAt: Date;

  @Prop()
  readonly updatedBy: string;

  @Prop(Date)
  readonly updatedAt: Date;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
