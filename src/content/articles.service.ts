import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Article, ArticleDocument } from './schemas/article.schema';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectModel(Article.name)
    private readonly articles: Model<ArticleDocument>,
  ) {}

  findPublished() {
    return this.articles
      .find({ published: true })
      .sort({ publishedAt: -1, createdAt: -1 })
      .exec();
  }
  findAll() {
    return this.articles.find().sort({ createdAt: -1 }).exec();
  }
  async findBySlug(slug: string) {
    const article = await this.articles
      .findOne({ slug, published: true })
      .exec();
    if (!article) throw new NotFoundException('Article not found');
    return article;
  }
  create(dto: CreateArticleDto) {
    return this.articles.create(dto);
  }
  async update(id: string, dto: UpdateArticleDto) {
    const article = await this.articles
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();
    if (!article) throw new NotFoundException('Article not found');
    return article;
  }
  async remove(id: string) {
    const article = await this.articles.findByIdAndDelete(id).exec();
    if (!article) throw new NotFoundException('Article not found');
    return { deleted: true };
  }
}
