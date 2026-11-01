import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BookDocument = HydratedDocument<Book>;

@Schema({ timestamps: true })
export class Book {
  @Prop({ required: true, trim: true }) title: string;
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;
  @Prop({ required: true, trim: true }) description: string;
  @Prop() coverImageUrl?: string;
  @Prop() purchaseUrl?: string;
  @Prop() publishedAt?: Date;
  @Prop({ default: true }) visible: boolean;
}

export const BookSchema = SchemaFactory.createForClass(Book);
