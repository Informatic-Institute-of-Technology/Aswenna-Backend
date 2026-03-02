import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, _id: false })
export class File extends Document {
  @Prop()
  readonly filename: string;

  @Prop()
  readonly fileSize: string;

  @Prop()
  readonly mimeType: string;

  @Prop()
  url?: string;

  @Prop(Date)
  readonly createdAt: Date;

  @Prop(Date)
  readonly updatedAt: Date;
}
