import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@ApiTags('Articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articles: ArticlesService) {}

  @Get() @ApiOperation({ summary: 'List published articles' })
  findPublished() { return this.articles.findPublished(); }

  @Get('manage') @ApiOperation({ summary: 'List all articles, including drafts' })
  findAll() { return this.articles.findAll(); }

  @Get(':slug') @ApiOperation({ summary: 'Get a published article by slug' })
  findBySlug(@Param('slug') slug: string) { return this.articles.findBySlug(slug); }

  @Post() @ApiOperation({ summary: 'Create an article or draft' })
  create(@Body() dto: CreateArticleDto) { return this.articles.create(dto); }

  @Patch(':id') @ApiOperation({ summary: 'Update an article' })
  update(@Param('id') id: string, @Body() dto: UpdateArticleDto) { return this.articles.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: 'Delete an article' })
  remove(@Param('id') id: string) { return this.articles.remove(id); }
}
