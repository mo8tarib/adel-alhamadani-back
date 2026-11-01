# Adel Alhamadani website API

NestJS API for a journalist and book writer website. Articles and book records are stored in MongoDB.

## Configuration

Set `MONGODB_URI` and optionally `PORT` in `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/adel_alhamadani
PORT=3000
```

Install dependencies and start the server:

```bash
npm install
npm run start:dev
```

Swagger UI is available at [http://localhost:3000/api/docs](http://localhost:3000/api/docs).

## Deploy to Google Cloud Run

Build and push the container to Artifact Registry, then deploy it to Cloud Run. Set `MONGODB_URI` as a Cloud Run environment variable or, preferably, reference it from Secret Manager. Cloud Run supplies `PORT`; the server listens on that port on `0.0.0.0`.

```bash
docker build -t REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/adel-alhamadani-back .
docker push REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/adel-alhamadani-back
gcloud run deploy adel-alhamadani-back \
  --image REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/adel-alhamadani-back \
  --region REGION \
  --set-secrets MONGODB_URI=mongodb-uri:latest
```

Create the `mongodb-uri` secret in Secret Manager and grant the Cloud Run service identity permission to access it before deployment. No `.env` file is copied into the Docker image.

## API

All API routes use the `/api` prefix.

- `GET /api/articles` lists published articles.
- `GET /api/articles/:slug` returns a published article.
- `GET /api/articles/manage` lists all articles, including drafts.
- `POST /api/articles`, `PATCH /api/articles/:id`, and `DELETE /api/articles/:id` manage articles.
- `GET /api/books` lists visible books.
- `GET /api/books/:slug` returns a visible book.
- `GET /api/books/manage` lists all books, including hidden titles.
- `POST /api/books`, `PATCH /api/books/:id`, and `DELETE /api/books/:id` manage books.

Article fields include title, slug, excerpt, content, tags, publication status, and publication date. Book fields include title, slug, description, cover image URL, purchase URL, visibility, and publication date. MongoDB timestamps are added automatically.

## Database seed

Run `npm run seed` from the backend directory to build and seed MongoDB from `src/content/seed-data.ts`. Books and articles are inserted by slug and existing records are only enriched with fields they do not yet contain; current admin edits and publication status are preserved. The profile receives the Arabic author label and the configured default portrait only when those profile values are missing. Set `MONGODB_URI` in the backend environment before running the command.
