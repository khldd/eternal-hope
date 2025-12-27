# Eternal Hope 🌿

A private, production-quality web app for discovering and documenting meaningful places together.

Built with love for Khaled & Amal.

## 🌱 Features

- **Google Maps Integration**: Paste any Google Maps link to automatically extract rich place data
- **AI-Powered Insights**: Gemini analyzes reviews to generate couple-oriented insights, vibe tags, and poetic descriptions
- **Beautiful Map**: Custom-styled Mapbox map with organic pin designs
- **Notes System**: Personal notes from both partners, beautifully styled
- **Status Tracking**: Mark places as Planned, Been There, Favorite, or Dream
- **Responsive Design**: Works beautifully on any device

## 🎨 Design Philosophy

- Y2K eco-tech aesthetic
- Organic shapes and soft grain textures
- Color palette: Moss green, Fern, Olive, Forest
- No pink, no generic romance UI
- Feels like a private experimental nature interface

## 🧱 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Maps**: Mapbox GL
- **AI**: Google Gemini API
- **State**: Zustand

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Fill in your API keys in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_public_token

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Google Maps (for place data extraction)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 3. Set Up Database

Run the SQL schema in your Supabase SQL Editor:

```bash
# Copy the contents of supabase/schema.sql and run in Supabase Dashboard
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see Eternal Hope.

## 📦 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── places/
│   │   │   ├── route.ts          # GET/POST places
│   │   │   ├── [id]/route.ts     # PATCH/DELETE place
│   │   │   ├── extract/route.ts  # Extract from Google Maps URL
│   │   │   └── analyze/route.ts  # Gemini AI analysis
│   │   └── notes/
│   │       ├── route.ts          # POST note
│   │       └── [id]/route.ts     # PATCH/DELETE note
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Map.tsx                   # Mapbox map with custom markers
│   ├── MapView.tsx               # Main view wrapper
│   ├── Header.tsx                # App header with filters
│   ├── PlacePanel.tsx            # Place detail slide panel
│   ├── PlacesList.tsx            # List view of places
│   └── AddPlaceModal.tsx         # Add place modal
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   ├── server.ts             # Server Supabase client
│   │   └── middleware.ts         # Auth middleware helper
│   ├── store.ts                  # Zustand state management
│   ├── google-maps-parser.ts     # Parse Google Maps URLs
│   └── gemini.ts                 # Gemini AI integration
└── types/
    └── database.ts               # TypeScript types for DB
```

## 🗺️ API Keys Required

1. **Supabase**: Create a project at [supabase.com](https://supabase.com)
2. **Mapbox**: Get a token at [mapbox.com](https://mapbox.com)
3. **Gemini**: Get an API key at [ai.google.dev](https://ai.google.dev)
4. **Google Maps** (optional): For enhanced place data extraction

## 💚 For Khaled & Amal

This app is your private space to document your journey together.
Every place holds a story waiting to be written.

*"A canvas for moments yet to be painted."*
