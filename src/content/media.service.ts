import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import type { Response } from 'express';

const MAX_COVER_BYTES = 5 * 1024 * 1024;
const MIME_SIGNATURES: Record<string, (buffer: Buffer) => boolean> = {
  'image/jpeg': (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.length >= 8 && b.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])),
  'image/webp': (b) => b.length >= 12 && b.toString('ascii',0,4) === 'RIFF' && b.toString('ascii',8,12) === 'WEBP',
};

@Injectable()
export class MediaService {
  constructor(@InjectConnection() private readonly connection: Connection) {}
  private bucket(): GridFSBucket {
    if (!this.connection.db) throw new Error('MongoDB connection is not ready');
    return new GridFSBucket(this.connection.db, { bucketName: 'siteMedia' });
  }
  async upload(file: any) {
    if (!file?.buffer || file.size > MAX_COVER_BYTES) throw new BadRequestException('الصورة مفقودة أو يتجاوز حجمها 5 ميغابايت');
    const signature = MIME_SIGNATURES[file.mimetype];
    if (!signature || !signature(file.buffer)) throw new BadRequestException('يسمح فقط بصور JPEG وPNG وWebP صالحة');
    const upload = this.bucket().openUploadStream(`cover-${Date.now()}`, { metadata: { contentType: file.mimetype } });
    return new Promise<{id:string;src:string}>((resolve,reject) => {
      upload.once('error', reject);
      upload.once('finish', () => { const id=String(upload.id); resolve({id,src:`/api/media/${id}`}); });
      upload.end(file.buffer);
    });
  }
  async stream(id: string, response: Response): Promise<void> {
    if (!ObjectId.isValid(id)) throw new NotFoundException('الصورة غير موجودة');
    const bucket=this.bucket(); const objectId=new ObjectId(id);
    const file=await bucket.find({_id:objectId}).next();
    if (!file) throw new NotFoundException('الصورة غير موجودة');
    response.setHeader('Content-Type', file.metadata?.contentType || 'application/octet-stream');
    response.setHeader('X-Content-Type-Options','nosniff');
    response.setHeader('Cache-Control','public, max-age=31536000, immutable');
    bucket.openDownloadStream(objectId).on('error',()=>response.end()).pipe(response);
  }
}
