# Cloudflare R2 image uploads

New cover and inline images upload directly to your R2 bucket. Only signed-in allowlisted editors can request uploads. After upload, the editor verifies the object and its public URL. Saving the article stores that permanent URL in the existing `cover_image_path` column, or directly in the Markdown for inline images. No database migration is needed.

Existing Supabase images keep working; this change does not move or delete old files. Do not delete the old bucket while posts still use it.

## 1. Configure a bucket in Cloudflare

Create or select an R2 bucket. R2 usage beyond its free allowance can incur ongoing storage and operation charges; check Cloudflare's current R2 pricing before enabling it. This app does not create buckets or change your Cloudflare settings.

In R2 → Manage R2 API Tokens, create **Object Read & Write** credentials restricted to that bucket. Copy the **Access Key ID** and **Secret Access Key** for the S3 API, not a general Cloudflare API token. Use a dedicated bucket and least-privilege credentials.

In bucket Settings, connect a **Custom Domain** for production, such as `https://images.yourdomain.com`. An enabled **Public Development URL** (`https://pub-….r2.dev`) can be used for testing, but is rate-limited and not intended for production. Do not use the S3 endpoint as the public base URL. Anything in this bucket is publicly readable once public access is enabled; upload blog images only.

## 2. Add environment variables in Vercel

Keep your existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Add:

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | Same Supabase project URL, for server-side upload authorization |
| `SUPABASE_ANON_KEY` | Same anon/publishable key, **not** service_role |
| `R2_ACCOUNT_ID` | Cloudflare's 32-character account ID |
| `R2_ACCESS_KEY_ID` | R2 S3 Access Key ID |
| `R2_SECRET_ACCESS_KEY` | R2 S3 Secret Access Key |
| `R2_BUCKET_NAME` | Exact bucket name |
| `R2_PUBLIC_BASE_URL` | Public HTTPS custom domain or enabled r2.dev URL; no query parameters |

Use Vercel → Project → Settings → Environment Variables, select the environments you need, then redeploy. Real credentials must never be committed to your public GitHub repository or prefixed with `VITE_`. Local development can use a git-ignored `.env` copied from `.env.example`.

## 3. Configure bucket CORS

In R2 bucket → Settings → CORS Policy, add the **editor's** actual origins. Replace the example below; origins have no trailing slash or path. Include individual preview domains if you test uploads there.

```json
[
  {
    "AllowedOrigins": ["https://your-editor.vercel.app", "http://localhost:8080"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

The browser PUTs the file to a signed S3 URL valid for five minutes. Upload bytes do not pass through Vercel (avoiding its request-body limit). The app uses unique names, not an overwrite interface. Only the permanent public URL is saved to the post; signed upload URLs are never saved.

## 4. Update your existing website's image URL helper

Your public website must accept absolute URLs as well as legacy Supabase object paths:

```ts
function mediaUrl(path: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return supabase.storage.from("azureblaze-media").getPublicUrl(path).data.publicUrl;
}
```

Use this for cover/social image fields. Inline Markdown already contains the R2 URL. If you use Next.js Image, allow the hostname from `R2_PUBLIC_BASE_URL` in `images.remotePatterns`. Your public website needs no R2 credentials: its Supabase public key reads the published post's URL and the browser loads that public image.

## 5. Verify after deployment

1. Sign in as your allowlisted admin and upload a cover plus an inline image.
2. Add cover alt text, save the draft, reload it and check both images remain visible.
3. Inspect `posts.cover_image_path`: it should start with your public R2 domain, not `covers/` or the S3 endpoint.
4. Publish the post and check the landing-page card and full article on your existing website.
5. Confirm an older post's Supabase images still display.

The existing JPG, PNG, WEBP, GIF and AVIF support and 5 MB limit remain. Client validation and post-upload metadata verification enforce normal editor use, but an S3 presigned PUT cannot enforce a hard byte cap against a malicious authorized admin before storage; keep upload access restricted to your trusted admin and monitor R2 usage. Unsaved uploads remain in R2; removing a cover or deleting a post does not automatically delete its object, avoiding broken images in other articles.

## Troubleshooting

- **Missing R2 configuration:** add all five R2 variables and redeploy.
- **Failed to fetch / CORS:** allow the exact editor origin in the bucket CORS policy.
- **403 / SignatureDoesNotMatch:** check the R2 S3 key pair, bucket scope, Object Read & Write permissions, and account ID. Do not substitute a general Cloudflare API token.
- **Uploaded but public URL unavailable:** enable public access or fix the custom domain and `R2_PUBLIC_BASE_URL`.
- **Not authorized:** use an account in the existing `admin_users` allowlist; no service key is needed.
- **Website adds a Supabase prefix to an R2 URL:** apply the URL helper above.