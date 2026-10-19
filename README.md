# CinePulse | Premium Cinematic Movie Streaming Platform

![CinePulse Banner](https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80)

**CinePulse** is a full-stack, production-ready movie streaming web application built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase PostgreSQL**, **Nodemailer Email OTP**, and **Persistent Object Storage (Cloudflare R2 / Supabase Storage)**.

---

## 🌟 Key Features

### 1. Cinematic User Experience
- **Original Brand & UI**: Sleek dark aesthetic (`#07080b`), cinematic crimson/amber accents, glassmorphic panels, and smooth animations.
- **Hero Premiere Billboard**: Large backdrop banner showcasing 4K Ultra HD, Dolby Atmos, and mature rating badges with instant playback.
- **Categorized Streaming Rows**: "Trending Now", "Recently Added", "Action & Sci-Fi", "Animation & Family", and "Fantasy & Drama" with smooth scrolling navigation.
- **Live Search & Multi-Filters**: Instant client-side & database-backed movie searching with filters by Genre, Release Year, and Audio Language.
- **Movie Details Modal & Page**: Full synopsis, cast members, director credits, runtime, and related movie suggestions.
- **Strict Publication Filtering**: Public visitors and members only see movies with `publication_status = 'published'`. Unpublished drafts and deleted records are strictly hidden.

### 2. Custom Cinematic Video Player (`/watch/[id]`)
- Distraction-free Theatre Mode with automatic overlay hiding after 3 seconds of inactivity.
- HTML5 video playback with smooth seeking and live buffer tracking.
- Interactive volume slider with quick mute toggle.
- Fullscreen mode (Fullscreen API) and Picture-in-Picture (PiP).
- Playback speed selector (`0.5x`, `0.75x`, `1x`, `1.25x`, `1.5x`, `2x`).
- Full keyboard shortcuts:
  - `Space` / `K`: Play & Pause
  - `F`: Fullscreen toggle
  - `M`: Mute & Unmute
  - `←` / `→`: Seek 10s Backward / Forward
  - `↑` / `↓`: Volume Up / Down
- Loading buffer indicator and stream error recovery.
- Authorized stream route (`/api/movies/[id]/stream`) that ensures members must be authenticated before video access is granted.

### 3. User Authentication & Email OTP Verification
- **Fields**: Full Name, Email Address, Mobile Number (International E.164), Password.
- **Real Email OTP Flow**:
  - A 6-digit verification code is sent to the **email address entered during registration** via SMTP (nodemailer).
  - Branded CinePulse HTML email template with the code and 10-minute expiry notice.
  - Server-side rate limiting (60-second resend cooldown timer, max 5 requests per hour).
  - Secure server-side verification (SHA-256 hashed codes, never stored or logged in plaintext to the client).
  - Never leaks OTP in browser network responses or UI.
  - Does not store OTPs or passwords in plaintext (SHA-256 for OTPs, salted bcrypt for passwords).
  - Maintains secure HttpOnly JWT session cookies (`jose`).
- **Server-Enforced Verification**: registration is accepted by the server only after the OTP record for that email has been verified and consumed.
- **Local Development Fallback**: when SMTP credentials are not configured, the generated code is written to the **server console** so registration can still be tested locally.

### 4. Protected Administrator Portal (`/admin`)
- **Designated Admin**: Bound strictly to `hostelform31@gmail.com`.
- **Server-Side Enforcement**: All admin APIs (`/api/admin/*`) and pages verify session credentials and role (`role === 'admin'`). Non-admin attempts receive `403 Forbidden`.
- **Automatic Role Assignment**: Registration or login with `hostelform31@gmail.com` assigns the administrator role safely in the database via server-side logic and PostgreSQL triggers.
- **Overview Dashboard**: Live counters for Total Movies, Published Movies, Unpublished Drafts, Registered Users, and Total Streaming Content Hours.
- **Movie Upload Form**:
  - Title, Synopsis, Genre, Release Year, Language, Duration, Cast, Director.
  - Poster image file upload with live preview and dropzone.
  - Video asset file upload with format check (`.mp4`, `.webm`, `.mkv`), file-size validation, and client progress bar.
  - Quick test presets for instant high-definition trailer publishing.
  - Preview movie card modal before publishing.
  - One-click toggle between "Publish Live Now" and "Save as Draft".
- **Movie Management**:
  - Table of all movie records with poster thumbnails, title, duration, status, and upload dates.
  - 1-click status switcher (Draft ⟷ Published) directly from the list.
  - Edit modal for updating titles, descriptions, and metadata.
  - Permanent delete modal with confirmation that also purges associated storage assets.
- **User Directory**: View registered member profiles, email addresses, phone numbers, verified OTP status, and registration dates.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS with custom glassmorphism and animations |
| **Database** | Supabase PostgreSQL with Row Level Security (RLS) |
| **Authentication** | Secure JWT Session Cookies (`jose`) + bcrypt password hashing |
| **Email OTP** | Nodemailer over SMTP (Gmail, Outlook, SendGrid, SES, ...) |
| **Object Storage** | Cloudflare R2 / Supabase Storage (Persistent media files) |
| **Icons** | Lucide React |

---

## 🚀 Getting Started Locally

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd movie
npm install
```

### 2. Environment Variables Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```env
# Application Info
NEXT_PUBLIC_APP_NAME="CinePulse"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Designated Administrator
ADMIN_EMAIL="hostelform31@gmail.com"

# Session Security (Generate a secure 32+ char secret)
JWT_SECRET="cinepulse-super-secure-production-jwt-token-secret-2026-key"

# Supabase PostgreSQL Configuration
NEXT_PUBLIC_SUPABASE_URL="https://rmewrafwckyqqrzdghsz.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_XLGVy9HzaAr-G7-CclAVCw_5vnV6Oni"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-secret"

# SMTP Email Delivery (Registration Email OTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-smtp-password"
SMTP_FROM="CinePulse <no-reply@cinepulse.app>"

# Video & Poster Storage
STORAGE_PROVIDER="supabase"
```

> **Note on Local Out-of-the-Box Mode**:
> CinePulse includes a persistent local JSON repository with 10+ royalty-free 4K/1080p open-source movie trailers (Blender Open Projects: Tears of Steel, Sintel, Big Buck Bunny, Cosmos Laundromat, etc.) so the app runs instantly without requiring live cloud credentials immediately! Once the Supabase and SMTP credentials are added to `.env.local`, CinePulse seamlessly transitions to live cloud mode.

### 3. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Setup (Supabase PostgreSQL)

1. Open your [Supabase Dashboard](https://supabase.com).
2. Go to **SQL Editor** -> **New Query**.
3. Copy and run the entire SQL migration script from `supabase/schema.sql`.
4. This will create:
   - `profiles` table with email index, phone number, verification flags, and role constraint (`user` / `admin`).
   - `movies` table with publication status, full-text search index, and metadata.
   - Row Level Security (RLS) policies allowing public read of published movies, and admin-only management (via a recursion-safe `is_admin()` helper function).
   - Automatic triggers that assign `role = 'admin'` to `hostelform31@gmail.com`.
   - **Seed record** for `hostelform31@gmail.com` with seeded password `1234princ@`.

> **Re-running the script**: the script drops and recreates the tables, so only run it against a project whose data you want to reset. It is idempotent for the seeded admin record (password hash and verification flags are refreshed on conflict).
>
> **Service role key**: the app's server code (user registration, admin panel, uploads) uses the Supabase **service_role** secret key to bypass RLS. Add it to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY` (Dashboard -> Project Settings -> API -> `service_role` secret). Without it the app transparently falls back to its local JSON store.

---

## 📧 Email OTP (SMTP) Setup

Registration is verified with a **6-digit code sent to the email address the user enters**. CinePulse sends it through any standard SMTP provider using `nodemailer`.

1. Pick an SMTP provider. For **Gmail**:
   - Enable 2-Step Verification on your Google account.
   - Go to **Google Account -> Security -> App passwords** and generate a 16-character App Password.
2. Configure the variables in `.env.local`:
   ```env
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_SECURE="false"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-16-char-app-password"
   SMTP_FROM="CinePulse <no-reply@cinepulse.app>"
   ```
   - Use `SMTP_PORT="465"` with `SMTP_SECURE="true"` for implicit TLS providers.
   - **SendGrid / Mailgun / Amazon SES** also work — just use their SMTP host, port, and API key as the password.
3. When these variables are left empty (local development), CinePulse writes the generated code to the **server console** (`[EMAIL-SERVICE-DISPATCH] ... Token=xxxxxx`) so registration can still be tested end-to-end. The code is never exposed in the browser UI or API responses.

---

## ☁️ Object Storage Setup (Supabase Storage or Cloudflare R2)

### Option A: Supabase Storage
1. In Supabase Dashboard, go to **Storage** -> **Create new bucket**.
2. Name the bucket `movies-media`.
3. Set Public bucket to `ON` (or configure signed URL access).
4. In Policies, add policy allowing authenticated administrators to upload and delete objects.

### Option B: Cloudflare R2 / AWS S3
1. In Cloudflare Dashboard, go to **R2 Object Storage** -> **Create bucket** `cinepulse-media`.
2. Generate an **API Token** with Read/Write access.
3. Configure `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_PUBLIC_DOMAIN` in `.env.local`.

---

## 🔐 Admin Authentication Credentials

- **Email**: `hostelform31@gmail.com`
- **Password**: `1234princ@` (enter it manually on the `/auth/login` page — there is no prefill shortcut)
- When logged in as this user, you will be redirected to the **Admin Dashboard** (`/admin`) and see the **Admin Dashboard** badge in the top navigation.
- The `/admin` page and every `/api/admin/*` endpoint re-verify the session and role server-side; any other signed-in user receives `403 Forbidden`.

---

## 🚢 Deployment (Vercel)

1. Push your repository to GitHub or GitLab.
2. In [Vercel](https://vercel.com), click **Add New Project** and import the repository.
3. Under **Environment Variables**, add the variables defined in `.env.example`:
   - `ADMIN_EMAIL`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_SECURE`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM`
   - `STORAGE_PROVIDER`
4. Click **Deploy**. Vercel will build and deploy the Next.js production bundle.

---

## 📄 License
This project is an original software design created for streaming entertainment with royalty-free creative commons content. All rights reserved.
