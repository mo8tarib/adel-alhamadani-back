import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';
import { Article, Book, Profile } from './content.schema';
import { SEED_CONTENT } from './seed-data';

async function seedCollection(
  model: Model<any>,
  records: readonly Record<string, unknown>[],
) {
  const result = { inserted: 0, enriched: 0, unchanged: 0 };
  for (const record of records) {
    const seed = Object.fromEntries(
      Object.entries(record).filter(([key]) => key !== 'id'),
    );
    const existing = await model.collection.findOne({ slug: seed.slug });
    if (!existing) {
      await model.create(seed);
      result.inserted++;
      continue;
    }
    const missing = Object.fromEntries(
      Object.entries(seed).filter(
        ([key, value]) => existing[key] === undefined && value !== undefined,
      ),
    );
    if (Object.keys(missing).length) {
      await model.collection.updateOne(
        { _id: existing._id },
        { $set: missing },
      );
      result.enriched++;
    } else {
      result.unchanged++;
    }
  }
  return result;
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  try {
    const books = app.get<Model<Book>>(getModelToken(Book.name));
    const articles = app.get<Model<Article>>(getModelToken(Article.name));
    const profiles = app.get<Model<Profile>>(getModelToken(Profile.name));

    const [bookResult, articleResult] = await Promise.all([
      seedCollection(books, SEED_CONTENT.books),
      seedCollection(articles, SEED_CONTENT.articles),
    ]);

    const author = SEED_CONTENT.author;
    const portrait = {
      src: 'https://storage.googleapis.com/adel-alhamadani/profile/adel-alhamadani.png',
      altAr: 'الكاتب والإعلامي العُماني عادل الحمداني',
      sourceUrl:
        'https://storage.googleapis.com/adel-alhamadani/profile/adel-alhamadani.png',
      sourceNameAr: 'صورة الملف الشخصي',
      approvalStatus: 'user-selected',
    };
    let profile = await profiles.collection.findOne({});
    if (!profile) {
      await profiles.create({
        nameAr: author.nameAr,
        roleAr: author.shortBioAr,
        shortBioAr: author.shortBioAr,
        biographyText: '',
        portrait,
        links: [],
      });
      profile = await profiles.collection.findOne({});
    } else {
      const profileUpdate: Record<string, unknown> = {};
      if (!profile.shortBioAr) profileUpdate.shortBioAr = author.shortBioAr;
      if (!profile.portrait) profileUpdate.portrait = portrait;
      if (Object.keys(profileUpdate).length) {
        await profiles.collection.updateOne(
          { _id: profile._id },
          { $set: profileUpdate },
        );
      }
    }

    console.log(
      JSON.stringify({
        books: bookResult,
        articles: articleResult,
        profile: { initialized: true, portraitSetIfMissing: true },
      }),
    );
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(
    'Database seed failed:',
    error instanceof Error ? error.message : 'unknown error',
  );
  process.exitCode = 1;
});
