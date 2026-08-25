# Madhav Pratap Singh — Dynamic Portfolio

A dark, terminal/scan-line themed portfolio site. Projects and certificates
(PDFs) are **not hardcoded** — they're stored in Supabase and rendered live,
so you can add a new project or certificate any time without touching code.

```
index.html     → public portfolio (what visitors see)
admin.html     → private admin panel (add/delete projects & certificates)
styles.css     → all styling
app.js         → fetches & renders data on the public page
admin.js       → login + create/delete logic for the admin panel
config.js      → your Supabase URL + anon key go here
supabase-schema.sql → run once in Supabase to create tables & storage
```

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → New project (free tier is enough).
2. Wait for it to finish provisioning (~2 minutes).

## 2. Run the schema

1. In your Supabase project, open **SQL Editor → New query**.
2. Paste the entire contents of `supabase-schema.sql` and click **Run**.
   This creates:
   - a `projects` table
   - a `certificates` table
   - a public `certificates` storage bucket for PDFs
   - security rules so **anyone can read**, but **only you (signed in) can write**
   - two sample projects and one sample certificate, so the site isn't empty

## 3. Create your admin login

1. Go to **Authentication → Users → Add user**.
2. Enter your own email and a strong password. Confirm the email if asked.
3. This is the account you'll use to log in at `admin.html`.

## 4. Connect the site to your project

1. In Supabase, go to **Project Settings → API**.
2. Copy the **Project URL** and the **anon public** key.
3. Open `config.js` and paste them in:
   ```js
   export const SUPABASE_URL = "https://xxxxxxxx.supabase.co";
   export const SUPABASE_ANON_KEY = "eyJhbGciOi...";
   ```
   Never paste the `service_role` secret key here — only `anon`.

## 5. Try it locally

Because the pages use ES modules, open them through a local server rather
than double-clicking the file:

```bash
npx serve .
# or
python3 -m http.server 5500
```

Then visit `http://localhost:5500` for the portfolio and
`http://localhost:5500/admin.html` to log in and add content.

## 6. Add your first real project or certificate

1. Go to `/admin.html`, sign in.
2. Fill in the **Add / update a project** form (title, description,
   highlights, tags, GitHub/demo links) → Save.
3. Fill in the **Add a certificate** form, attach the PDF file → Save.
   The PDF is uploaded to Supabase Storage and linked automatically.
4. Refresh `index.html` — your new entry appears instantly. No redeploy needed.

## 7. Deploy

Any static host works, since there's no build step:

- **Netlify / Vercel**: drag-and-drop the folder, or connect the GitHub repo.
- **GitHub Pages**: push this folder to a repo and enable Pages.

Keep `admin.html` reachable only by you — it's not linked from the public
nav. Security is enforced by Supabase auth + row-level security either way,
so even if someone finds the URL they can't write data without your login.

## Customizing

- **Resume link**: replace `/resume.pdf` in `index.html`'s nav button with
  your actual resume file or a hosted link.
- **Contact details**: update the email/phone in the `#contact` section of
  `index.html`.
- **Colors/fonts**: all design tokens live at the top of `styles.css` under
  `:root`.
