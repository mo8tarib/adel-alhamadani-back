import {
  Controller,
  BadRequestException,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AdminGuard } from './content.guard';
import { MediaService } from './media.service';

const imageUpload = () =>
  UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
      fileFilter: (_request, file, done) =>
        file.mimetype.startsWith('image/')
          ? done(null, true)
          : done(new BadRequestException('يسمح فقط برفع ملفات الصور'), false),
    }),
  );

@ApiTags('Admin media')
@ApiBearerAuth('access-token')
@Controller('admin/media')
@UseGuards(AdminGuard)
export class AdminMediaController {
  constructor(private readonly media: MediaService) {}

  @Post('covers')
  @imageUpload()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiCreatedResponse({ description: 'Upload a book cover image' })
  uploadCover(@UploadedFile() file: unknown) {
    return this.media.upload('books', file);
  }

  @Post(':scope')
  @imageUpload()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiCreatedResponse({
    description: 'Upload an image for a book cover or author profile',
  })
  upload(@Param('scope') scope: string, @UploadedFile() file: unknown) {
    return this.media.upload(scope, file);
  }

  @Put(':scope/:id')
  @imageUpload()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({
    description: 'Replace an uploaded image while keeping its URL',
  })
  replace(
    @Param('scope') scope: string,
    @Param('id') id: string,
    @UploadedFile() file: unknown,
  ) {
    return this.media.replace(scope, id, file);
  }

  @Delete(':scope/:id')
  @ApiOkResponse({ description: 'Delete an uploaded image' })
  remove(@Param('scope') scope: string, @Param('id') id: string) {
    return this.media.remove(scope, id);
  }
}

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Get(':scope/:id')
  @ApiOkResponse({ description: 'Read an image from Google Cloud Storage' })
  get(
    @Param('scope') scope: string,
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    return this.media.stream(scope, id, response);
  }
}
