import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Meta extends Document {
  @Prop()
  readonly key: string;

  @Prop()
  readonly value: string;

  @Prop()
  readonly status: boolean;
}
