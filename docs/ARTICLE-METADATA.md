# Separate article SEO and social fields

## Upgrade your existing database

Before deploying this editor update, run [`database/article-metadata.sql`](../database/article-metadata.sql) in your existing Supabase project's SQL Editor. This adds three columns without changing your articles or access policies. New installations can use the updated full `database/schema.sql` instead.

## Editor fields → website tags

Your public website is separate from this editor. Include these columns when reading published posts and map them as follows:

| Editor field | Database column | Website output |
| --- | --- | --- |
| Meta title | `seo_title` | `<title>` |
| Meta description | `seo_description` | `<meta name="description">` |
| OG title | `og_title` | `<meta property="og:title">` and `twitter:title` |
| OG description | `og_description` | `<meta property="og:description">` and `twitter:description` |
| Keywords / tags | `tags` (text array) | Article tags; optionally `<meta name="keywords">` |
| Cover alt text | `cover_image_alt` | Cover `<img alt>` |
| Social image | `social_image_path` | `og:image` and `twitter:image`, falling back to `cover_image_path` |

Tags are entered comma-separated. Keywords are not a Google ranking signal; tags remain useful for article categorization.

For older articles or blank overrides:

```ts
const metaTitle = post.seo_title || post.title;
const metaDescription = post.seo_description || post.excerpt || "";
const ogTitle = post.og_title || metaTitle;
const ogDescription = post.og_description || metaDescription;
const keywords = (post.tags || []).join(", ");
```

Keep these tags on the public article page, not the private editor. Render them in the initial HTML so social crawlers can read them. Use your framework's metadata API rather than injecting unescaped strings. Existing article titles, excerpts and Markdown are unchanged.