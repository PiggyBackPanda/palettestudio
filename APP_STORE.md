# Palette Studio — App Store Submission Guide

## Prerequisites

1. **Apple Developer Account** ($99/year)
   → https://developer.apple.com/programs/enroll/

2. **Codemagic Account** (free tier: 500 build mins/month)
   → https://codemagic.io — sign in with GitHub

## Setup Steps

### 1. Apple Developer Portal

1. Sign in at https://developer.apple.com
2. Go to **Certificates, Identifiers & Profiles**
3. Create a new **App ID**:
   - Bundle ID: `com.palettestudio.app`
   - Description: `Palette Studio`
   - Capabilities: none needed

### 2. App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - **Name:** Palette Studio
   - **Bundle ID:** Select `com.palettestudio.app`
   - **SKU:** `palette-studio-001`
   - **Primary Language:** English (U.K.) or English (U.S.)

4. **App Information:**
   - **Subtitle:** Brand Colour Toolkit
   - **Category:** Graphics & Design
   - **Secondary Category:** Utilities

5. **Description:**
   ```
   Build professional brand colour palettes in minutes. Palette Studio
   helps you create, refine, and export colour systems that work.

   • Extract colours from any image — upload a logo or photo
   • Get instant diagnostics — contrast issues, accessibility warnings
   • Assign colour roles — Hero, Accent, Background, Text, Neutral
   • Preview in real templates — business cards, websites, social posts
   • Generate dark mode variants and explore palette variations
   • Compare against competitors or saved versions
   • Export to Figma, Tailwind CSS, Webflow, and more
   • Full brand guide with print-ready PDF output

   No account needed. No data collected. Everything runs on your device.
   ```

6. **Keywords:**
   ```
   colour,palette,brand,design,accessibility,contrast,WCAG,export,
   figma,tailwind,mockup,dark mode,typography
   ```

7. **Privacy Policy URL:** (required — even with no data collection)
   You can use a simple privacy policy generator or host one on your site.

### 3. Generate Icons

Open `scripts/generate-icons.html` in your browser and click each button
to download PNG icons at the required sizes. Then:

- Upload the **1024×1024** icon in App Store Connect
- Place the other sizes in `resources/` and Capacitor will use them

### 4. Connect Codemagic

1. Go to https://codemagic.io
2. **Add application** → Select your GitHub repo
3. Choose **codemagic.yaml** workflow (it'll auto-detect the file)
4. Go to **Settings** → **Environment variables** → Add group `app_store_credentials`:
   - `APP_STORE_CONNECT_KEY_IDENTIFIER` — from App Store Connect API key
   - `APP_STORE_CONNECT_ISSUER_ID` — from App Store Connect
   - `APP_STORE_CONNECT_PRIVATE_KEY` — the .p8 file contents

5. **Start build** — Codemagic will:
   - Install dependencies
   - Build the web app
   - Create the iOS project via Capacitor
   - Sign the app
   - Build the IPA
   - Upload to TestFlight automatically

### 5. TestFlight

Once Codemagic uploads the build:
1. Go to App Store Connect → TestFlight
2. The build will appear after Apple processes it (~15-30 minutes)
3. Test on your own device via TestFlight app
4. Invite external testers if desired

### 6. Submit for Review

1. In App Store Connect, go to your app → **App Store** tab
2. Select the TestFlight build
3. Add screenshots (take from iOS Simulator or TestFlight):
   - 6.7" (iPhone 15 Pro Max): 1290 × 2796
   - 6.1" (iPhone 15): 1179 × 2556
   - iPad Pro 12.9": 2048 × 2732
4. Fill in the review notes
5. Submit for review — typically 24-48 hours

## Ongoing Updates

Push to `main` → Codemagic auto-builds → uploaded to TestFlight.
When ready, promote the TestFlight build to production in App Store Connect.

## Costs

| Item | Cost |
|------|------|
| Apple Developer Program | $99/year |
| Codemagic (free tier) | $0 |
| Netlify (free tier) | $0 |
| **Total** | **$99/year** |
