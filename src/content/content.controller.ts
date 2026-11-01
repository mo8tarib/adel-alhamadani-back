import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ContentService, AuthService } from './content.service';
import { AdminGuard, OwnerGuard } from './content.guard';
@Controller('content') export class ContentController { constructor(private content:ContentService){} @Get() get(){return this.content.publicContent();} }
@Controller('auth') export class AuthController { constructor(private auth:AuthService){} @Post('login') login(@Body() b:any){return this.auth.login(b.username,b.password);} @Get('me') @UseGuards(AdminGuard) me(@Req() req:any){return req.admin;} }
@Controller('admin') @UseGuards(AdminGuard) export class AdminController { constructor(private content:ContentService){}
 @Get('books') books(){return this.content.list('books');} @Post('books') createBook(@Body() b:any){return this.content.create('books',b);} @Patch('books/:id') updateBook(@Param('id') id:string,@Body() b:any){return this.content.update('books',id,b);} @Delete('books/:id') deleteBook(@Param('id') id:string){return this.content.remove('books',id);}
 @Get('articles') articles(){return this.content.list('articles');} @Post('articles') createArticle(@Body() b:any){return this.content.create('articles',b);} @Patch('articles/:id') updateArticle(@Param('id') id:string,@Body() b:any){return this.content.update('articles',id,b);} @Delete('articles/:id') deleteArticle(@Param('id') id:string){return this.content.remove('articles',id);}
 @Get('profile') profile(){return this.content.getProfile();} @Patch('profile') updateProfile(@Body() b:any){return this.content.updateProfile(b);}
 @Get('admins') @UseGuards(OwnerGuard) admins(){return this.content.admins();} @Post('admins') @UseGuards(OwnerGuard) createAdmin(@Body() b:any){return this.content.createAdmin(b.username,b.password);} @Delete('admins/:id') @UseGuards(OwnerGuard) deleteAdmin(@Param('id') id:string){return this.content.deleteAdmin(id);}
 }
