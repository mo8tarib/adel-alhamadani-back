import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book, BookDocument } from './schemas/book.schema';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book.name) private readonly books: Model<BookDocument>,
  ) {}
  findVisible() {
    return this.books
      .find({ visible: true })
      .sort({ publishedAt: -1, createdAt: -1 })
      .exec();
  }
  findAll() {
    return this.books.find().sort({ createdAt: -1 }).exec();
  }
  async findBySlug(slug: string) {
    const book = await this.books.findOne({ slug, visible: true }).exec();
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }
  create(dto: CreateBookDto) {
    return this.books.create(dto);
  }
  async update(id: string, dto: UpdateBookDto) {
    const book = await this.books
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }
  async remove(id: string) {
    const book = await this.books.findByIdAndDelete(id).exec();
    if (!book) throw new NotFoundException('Book not found');
    return { deleted: true };
  }
}
