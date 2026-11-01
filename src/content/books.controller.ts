import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@ApiTags('Books')
@Controller('books')
export class BooksController {
  constructor(private readonly books: BooksService) {}
  @Get() @ApiOperation({ summary: 'List visible books' })
  findVisible() { return this.books.findVisible(); }
  @Get('manage') @ApiOperation({ summary: 'List all books, including hidden titles' })
  findAll() { return this.books.findAll(); }
  @Get(':slug') @ApiOperation({ summary: 'Get a visible book by slug' })
  findBySlug(@Param('slug') slug: string) { return this.books.findBySlug(slug); }
  @Post() @ApiOperation({ summary: 'Add a book' })
  create(@Body() dto: CreateBookDto) { return this.books.create(dto); }
  @Patch(':id') @ApiOperation({ summary: 'Update a book' })
  update(@Param('id') id: string, @Body() dto: UpdateBookDto) { return this.books.update(id, dto); }
  @Delete(':id') @ApiOperation({ summary: 'Delete a book' })
  remove(@Param('id') id: string) { return this.books.remove(id); }
}
