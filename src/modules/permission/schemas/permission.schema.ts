import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Meta } from 'src/common/schemas/meta.schema';

@Schema({ timestamps: true })
export class Permission extends Document {
  declare readonly _id: Types.ObjectId;

  @Prop()
  readonly scope: string;

  @Prop()
  readonly description: string;

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

export const PermissionSchema = SchemaFactory.createForClass(Permission);
