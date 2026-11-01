import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentController, AuthController, AdminController } from './content.controller';
import { Article, ArticleSchema, Book, BookSchema, Profile, ProfileSchema, AdminUser, AdminUserSchema } from './content.schema';
import { ContentService, AuthService } from './content.service';
import { AdminGuard, OwnerGuard } from './content.guard';
@Module({ imports: [MongooseModule.forFeature([{name: Book.name, schema: BookSchema},{name: Article.name,schema:ArticleSchema},{name:Profile.name,schema:ProfileSchema},{name:AdminUser.name,schema:AdminUserSchema}])], controllers:[ContentController,AuthController,AdminController], providers:[ContentService,AuthService,AdminGuard,OwnerGuard] })
export class ContentModule {}
