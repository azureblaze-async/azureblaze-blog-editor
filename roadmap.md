# R2 image uploads
- [x] Replace new cover and inline uploads with authenticated R2 uploads.
- [x] Preserve existing Supabase image links and store new public R2 URLs.
- [x] Document environment-only configuration for Vercel, R2 public access and CORS.
- [x] Test validation, authorization and upload logic (16 passing tests); verify editor renders without runtime errors.
- [ ] Verify live admin upload, save and website readback — blocked by external Supabase/R2 credentials and bucket configuration not supplied in this preview.

# Article SEO & social
- [x] Add independent meta and OG fields, tags, and clearly labeled cover alt text; verified entry on desktop/mobile.
- [x] Preserve metadata in the save payload, test independent values, and document SQL upgrade and website mappings (13 relevant tests passing).
- [ ] Apply SQL upgrade and verify authenticated save/readback — requires access to the user's external database.