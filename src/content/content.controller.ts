import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ContentService, AuthService } from './content.service';
import { AdminGuard, OwnerGuard } from './content.guard';

const bookSchema = { type: 'object', required: ['titleAr', 'slug'], properties: { _id:{type:'string'}, id:{type:'string'}, titleAr:{type:'string'}, slug:{type:'string'}, synopsisAr:{type:'string'}, genre:{type:'string'}, publicationYear:{type:'number'}, publisher:{type:'string'}, isbn:{type:'string'}, numberOfPages:{type:'number'}, sources:{type:'array',items:{type:'object',additionalProperties:true}}, featured:{type:'boolean'}, status:{type:'string',enum:['draft','published']}, cover:{type:'object',additionalProperties:true}, links:{type:'array',items:{type:'object',additionalProperties:true}} } };
const articleSchema = { type: 'object', required: ['titleAr','slug'], properties: { _id:{type:'string'}, id:{type:'string'}, titleAr:{type:'string'}, slug:{type:'string'}, summaryAr:{type:'string'}, category:{type:'string'}, tags:{type:'array',items:{type:'string'}}, originalPublication:{type:'string'}, sourceUrl:{type:'string'}, publishedAt:{type:'string'}, sources:{type:'array',items:{type:'object',additionalProperties:true}}, body:{type:'array',items:{type:'string'}}, bodyAuthorized:{type:'boolean'}, featured:{type:'boolean'}, status:{type:'string',enum:['draft','published']} } };
const profileSchema = { type:'object',properties:{nameAr:{type:'string'},roleAr:{type:'string'},shortBioAr:{type:'string'},biographyText:{type:'string'},portrait:{type:'object',additionalProperties:true},links:{type:'array',items:{type:'object',additionalProperties:true}}} };

@ApiTags('Content')
@Controller('content')
export class ContentController {
  constructor(private readonly content: ContentService) {}
  @Get() @ApiOkResponse({ schema: { type:'object', properties:{author:profileSchema,books:{type:'array',items:bookSchema},articles:{type:'array',items:articleSchema}} } })
  get() { return this.content.publicContent(); }
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('login') @ApiBody({ schema:{type:'object',required:['username','password'],properties:{username:{type:'string'},password:{type:'string',format:'password'}}} }) @ApiCreatedResponse({schema:{type:'object',properties:{accessToken:{type:'string'},user:{type:'object',properties:{id:{type:'string'},username:{type:'string'},role:{type:'string',enum:['owner','admin']}}}}}})
  login(@Body() body: any) { return this.auth.login(body.username, body.password); }
  @Get('me') @UseGuards(AdminGuard) @ApiBearerAuth('access-token') @ApiOkResponse({schema:{type:'object',properties:{id:{type:'string'},username:{type:'string'},role:{type:'string',enum:['owner','admin']}}}})
  me(@Req() request: any) { return request.admin; }
  @Patch('password') @UseGuards(AdminGuard) @ApiBearerAuth('access-token') @ApiBody({schema:{type:'object',required:['currentPassword','newPassword'],properties:{currentPassword:{type:'string',format:'password'},newPassword:{type:'string',format:'password',minLength:12}}}}) @ApiOkResponse({schema:{type:'object',properties:{changed:{type:'boolean'}}}})
  changePassword(@Req() request:any,@Body() body:any) { return this.auth.changePassword(request.admin.id,body.currentPassword,body.newPassword); }
}

@ApiTags('Admin') @ApiBearerAuth('access-token') @Controller('admin') @UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly content: ContentService) {}
  @Get('books') @ApiOkResponse({schema:{type:'array',items:bookSchema}}) books() { return this.content.list('books'); }
  @Post('books') @ApiBody({schema:bookSchema}) @ApiCreatedResponse({schema:bookSchema}) createBook(@Body() body:any) { return this.content.create('books',body); }
  @Patch('books/:id') @ApiBody({schema:bookSchema}) @ApiOkResponse({schema:bookSchema}) updateBook(@Param('id') id:string,@Body() body:any) { return this.content.update('books',id,body); }
  @Delete('books/:id') @ApiOkResponse({schema:{type:'object',properties:{deleted:{type:'boolean'}}}}) deleteBook(@Param('id') id:string) { return this.content.remove('books',id); }
  @Get('articles') @ApiOkResponse({schema:{type:'array',items:articleSchema}}) articles() { return this.content.list('articles'); }
  @Post('articles') @ApiBody({schema:articleSchema}) @ApiCreatedResponse({schema:articleSchema}) createArticle(@Body() body:any) { return this.content.create('articles',body); }
  @Patch('articles/:id') @ApiBody({schema:articleSchema}) @ApiOkResponse({schema:articleSchema}) updateArticle(@Param('id') id:string,@Body() body:any) { return this.content.update('articles',id,body); }
  @Delete('articles/:id') @ApiOkResponse({schema:{type:'object',properties:{deleted:{type:'boolean'}}}}) deleteArticle(@Param('id') id:string) { return this.content.remove('articles',id); }
  @Get('profile') @ApiOkResponse({schema:profileSchema}) profile() { return this.content.getProfile(); }
  @Patch('profile') @ApiBody({schema:profileSchema}) @ApiOkResponse({schema:profileSchema}) updateProfile(@Body() body:any) { return this.content.updateProfile(body); }
  @Get('admins') @UseGuards(OwnerGuard) @ApiOkResponse({schema:{type:'array',items:{type:'object',properties:{_id:{type:'string'},username:{type:'string'},role:{type:'string'},active:{type:'boolean'}}}}}) admins() { return this.content.admins(); }
  @Post('admins') @UseGuards(OwnerGuard) @ApiBody({schema:{type:'object',required:['username','password'],properties:{username:{type:'string'},password:{type:'string',format:'password'}}}}) @ApiCreatedResponse({schema:{type:'object',properties:{id:{type:'string'},username:{type:'string'},role:{type:'string'}}}}) createAdmin(@Body() body:any) { return this.content.createAdmin(body.username,body.password); }
  @Delete('admins/:id') @UseGuards(OwnerGuard) @ApiOkResponse({schema:{type:'object',properties:{deleted:{type:'boolean'}}}}) deleteAdmin(@Param('id') id:string) { return this.content.deleteAdmin(id); }
}
