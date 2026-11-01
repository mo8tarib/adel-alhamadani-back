import { Controller, Get, Param, Post, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AdminGuard } from './content.guard';
import { MediaService } from './media.service';

@ApiTags('Admin') @ApiBearerAuth('access-token') @Controller('admin/media') @UseGuards(AdminGuard)
export class AdminMediaController {
  constructor(private readonly media: MediaService) {}
  @Post('covers')
  @UseInterceptors(FileInterceptor('file',{limits:{fileSize:5*1024*1024,files:1},fileFilter:(_req,file,done)=>file.mimetype.startsWith('image/')?done(null,true):done(new Error('Invalid image type'),false)}))
  @ApiConsumes('multipart/form-data')
  @ApiBody({schema:{type:'object',required:['file'],properties:{file:{type:'string',format:'binary'}}}})
  @ApiCreatedResponse({schema:{type:'object',required:['id','src'],properties:{id:{type:'string'},src:{type:'string'}}}})
  upload(@UploadedFile() file:any) { return this.media.upload(file); }
}

@ApiTags('Media') @Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}
  @Get(':id') @ApiOkResponse({description:'صورة الغلاف بصيغتها الأصلية'})
  get(@Param('id') id:string,@Res() response:Response) { return this.media.stream(id,response); }
}
