import { Storage } from '@google-cloud/storage';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import {
  BadRequestException,
  Injectable,
  OnModuleInit,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'node:crypto';
import { Model } from 'mongoose';
import type { Response } from 'express';
import { Book, Profile } from './content.schema';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MIME_SIGNATURES: Record<string, (buffer: Buffer) => boolean> = {
  'image/jpeg': (b) =>
    b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) =>
    b.length >= 8 &&
    b
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (b) =>
    b.length >= 12 &&
    b.toString('ascii', 0, 4) === 'RIFF' &&
    b.toString('ascii', 8, 12) === 'WEBP',
};
const VALID_SCOPES = ['books', 'profile'] as const;
type MediaScope = (typeof VALID_SCOPES)[number];
type UploadedImage = { buffer: Buffer; size: number; mimetype: string };

@Injectable()
export class MediaService implements OnModuleInit {
  private storage: Storage;
  private readonly bucketName: string;
  private readonly keyFilename?: string;
  private readonly serviceAccountSecret?: string;

  constructor(
    config: ConfigService,
    @InjectModel(Book.name) private readonly books: Model<Book>,
    @InjectModel(Profile.name) private readonly profiles: Model<Profile>,
  ) {
    this.keyFilename = config.get<string>('GOOGLE_APPLICATION_CREDENTIALS');
    this.serviceAccountSecret = config.get<string>(
      'GCP_SERVICE_ACCOUNT_SECRET',
    );
    this.storage = new Storage(
      this.keyFilename ? { keyFilename: this.keyFilename } : {},
    );
    this.bucketName = config.get<string>('GCS_BUCKET') || 'adel-alhamadani';
  }

  async onModuleInit() {
    if (!this.serviceAccountSecret) return;

    const secretManager = new SecretManagerServiceClient();
    try {
      const [version] = await secretManager.accessSecretVersion({
        name: this.serviceAccountSecret,
      });
      const secret = version.payload?.data?.toString('utf8');
      if (!secret) throw new Error('Secret payload is empty');

      const key = JSON.parse(secret) as {
        project_id?: unknown;
        client_email?: unknown;
        private_key?: unknown;
      };
      if (
        typeof key.project_id !== 'string' ||
        typeof key.client_email !== 'string' ||
        typeof key.private_key !== 'string'
      ) {
        throw new Error('Secret does not contain a valid service account key');
      }

      this.storage = new Storage({
        projectId: key.project_id,
        credentials: {
          client_email: key.client_email,
          private_key: key.private_key,
        },
      });
    } catch {
      throw new Error(
        'Unable to load the configured Google service account secret from Secret Manager',
      );
    } finally {
      await secretManager.close();
    }
  }

  private getBucket() {
    return this.storage.bucket(this.bucketName);
  }

  private validateFile(file: unknown): asserts file is UploadedImage {
    if (
      !file ||
      typeof file !== 'object' ||
      !('buffer' in file) ||
      !Buffer.isBuffer(file.buffer) ||
      !('size' in file) ||
      typeof file.size !== 'number' ||
      file.size > MAX_IMAGE_BYTES ||
      !('mimetype' in file) ||
      typeof file.mimetype !== 'string'
    ) {
      throw new BadRequestException('الصورة مفقودة أو يتجاوز حجمها 5 ميغابايت');
    }
    const signature = MIME_SIGNATURES[file.mimetype];
    if (!signature || !signature(file.buffer)) {
      throw new BadRequestException('يسمح فقط بصور JPEG وPNG وWebP صالحة');
    }
  }

  private validateScope(scope: string): asserts scope is MediaScope {
    if (!VALID_SCOPES.includes(scope as MediaScope)) {
      throw new BadRequestException('نطاق الصورة يجب أن يكون books أو profile');
    }
  }

  private imageUrl(scope: MediaScope, id: string): string {
    const objectName = `media/${scope}/${id}`;
    return `https://storage.googleapis.com/${this.bucketName}/${objectName
      .split('/')
      .map(encodeURIComponent)
      .join('/')}`;
  }

  async upload(scope: string, file: unknown) {
    this.validateScope(scope);
    this.validateFile(file);
    const id = randomUUID();
    const object = this.getBucket().file(`media/${scope}/${id}`);
    await object.save(file.buffer, {
      resumable: false,
      metadata: {
        contentType: file.mimetype,
        cacheControl: 'public, max-age=31536000, immutable',
        metadata: { scope },
      },
    });
    return {
      id,
      scope,
      src: this.imageUrl(scope, id),
      contentType: file.mimetype,
    };
  }

  async replace(scope: string, id: string, file: unknown) {
    this.validateScope(scope);
    this.validateId(id);
    this.validateFile(file);
    const object = this.getBucket().file(`media/${scope}/${id}`);
    const [exists] = await object.exists();
    if (!exists) throw new NotFoundException('الصورة غير موجودة');
    await object.save(file.buffer, {
      resumable: false,
      metadata: {
        contentType: file.mimetype,
        cacheControl: 'public, max-age=31536000, immutable',
        metadata: { scope },
      },
    });
    return {
      id,
      scope,
      src: this.imageUrl(scope, id),
      contentType: file.mimetype,
    };
  }

  async remove(scope: string, id: string) {
    this.validateScope(scope);
    this.validateId(id);
    const object = this.getBucket().file(`media/${scope}/${id}`);
    const [exists] = await object.exists();
    if (!exists) throw new NotFoundException('الصورة غير موجودة');
    await object.delete();
    const src = this.imageUrl(scope, id);
    if (scope === 'books') {
      await this.books
        .updateMany({ 'cover.src': src }, { $set: { 'cover.src': '' } })
        .exec();
    } else {
      await this.profiles
        .updateMany({ 'portrait.src': src }, { $set: { 'portrait.src': '' } })
        .exec();
    }
    return { deleted: true, id, scope };
  }

  private validateId(id: string) {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
      )
    ) {
      throw new NotFoundException('الصورة غير موجودة');
    }
  }

  async stream(scope: string, id: string, response: Response): Promise<void> {
    this.validateScope(scope);
    this.validateId(id);
    const object = this.getBucket().file(`media/${scope}/${id}`);
    const [metadata] = await object.getMetadata().catch(() => {
      throw new NotFoundException('الصورة غير موجودة');
    });
    response.setHeader(
      'Content-Type',
      metadata.contentType || 'application/octet-stream',
    );
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    object
      .createReadStream()
      .on('error', () => response.end())
      .pipe(response);
  }
}
