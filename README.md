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

For media uploads on Cloud Run, set `GCS_BUCKET=adel-alhamadani` and grant the Cloud Run service identity the **Storage Object Admin** role on that bucket. Prefer using the attached service identity through Application Default Credentials, without a key file.

The service-account JSON key is ignored by Git and Docker. Never add it with `COPY`, a Docker build argument, or a normal build secret: those approaches can expose the key in the image or its build metadata. The application reads a runtime-mounted key when `GOOGLE_APPLICATION_CREDENTIALS` points to it. For local Docker runs, mount it read-only:

```bash
docker build -t adel-alhamadani-back:local .
docker run --rm -p 8080:8080 \
  --env-file .env \
  --env GOOGLE_APPLICATION_CREDENTIALS=/var/secrets/google/service-account.json \
  --mount type=bind,src="$(pwd)/adel-alhamadani-dev-8b88eb71e16e.json",dst=/var/secrets/google/service-account.json,readonly \
  adel-alhamadani-back:local
```

Use the existing Secret Manager version for Cloud Run instead of passing the JSON key to the Docker build. Grant the Cloud Run runtime identity access to the secret:

```bash
gcloud secrets add-iam-policy-binding adel-alhamadani-service-account \
  --project=832683193458 \
  --member="serviceAccount:CLOUD_RUN_RUNTIME_SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"

gcloud run services update SERVICE_NAME \
  --project=832683193458 \
  --region REGION \
  --update-secrets=/var/secrets/google/service-account.json=adel-alhamadani-service-account:1 \
  --update-env-vars=GOOGLE_APPLICATION_CREDENTIALS=/var/secrets/google/service-account.json,GCS_BUCKET=adel-alhamadani
```

Grant the service account inside that key **Storage Object Admin** on the bucket. The Cloud Run runtime identity needs **Secret Manager Secret Accessor** to read the mounted key. Google recommends Secret Manager for runtime secrets, which can be mounted as files. [Cloud Run secrets](https://docs.cloud.google.com/run/docs/configuring/services/secrets), [adding a secret from a file](https://docs.cloud.google.com/secret-manager/docs/add-secret-version).

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

## Book and profile images

Authenticated admins can upload JPEG, PNG, or WebP images up to 5 MB:

- `POST /api/admin/media/covers` uploads a book cover.
- `POST /api/admin/media/profile` uploads the author portrait.
- `PUT /api/admin/media/:scope/:id` replaces an image (`scope` is `books` or `profile`).
- `DELETE /api/admin/media/:scope/:id` deletes an image.
- `GET /api/media/:scope/:id` serves an uploaded image.

Upload and replace requests use `multipart/form-data` with a `file` field and require the admin bearer token. The response includes `id` and `src`; save `src` to a book's `cover.src` or the profile's `portrait.src` using the existing admin update endpoints. Deleting media removes the object from the bucket; remove or replace its database reference as part of the same content edit.

## Database seed

Run `npm run seed` from the backend directory to build and seed MongoDB from `src/content/seed-data.ts`. Books and articles are inserted by slug and existing records are only enriched with fields they do not yet contain; current admin edits and publication status are preserved. The profile receives the Arabic author label and the configured default portrait only when those profile values are missing. Set `MONGODB_URI` in the backend environment before running the command.
