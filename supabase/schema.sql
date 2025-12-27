-- Eternal Hope Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create custom types
create type place_status as enum ('planned', 'been_there', 'favorite', 'dream');
create type author as enum ('khaled', 'amal');

-- Places table
create table places (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  google_place_id text not null unique,
  google_maps_url text not null,
  name text not null,
  address text,
  latitude double precision not null,
  longitude double precision not null,
  status place_status default 'planned' not null,
  rating double precision,
  price_level integer,
  types text[],
  phone text,
  website text,
  opening_hours jsonb,
  raw_reviews jsonb,
  ai_summary text,
  ai_couple_insights text,
  ai_vibe_tags text[],
  ai_poetic_description text,
  ai_general_description text,
  ai_processed_at timestamp with time zone,
  photo_urls text[],
  added_by author not null
);

-- Notes table
create table notes (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  place_id uuid references places(id) on delete cascade not null,
  author author not null,
  content text not null
);

-- Tags table
create table tags (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null unique,
  color text
);

-- Place-Tags junction table
create table place_tags (
  place_id uuid references places(id) on delete cascade not null,
  tag_id uuid references tags(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (place_id, tag_id)
);

-- Photos table
create table photos (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  place_id uuid references places(id) on delete cascade not null,
  storage_path text not null,
  caption text,
  uploaded_by author not null
);

-- Indexes for performance
create index places_status_idx on places(status);
create index places_location_idx on places(latitude, longitude);
create index notes_place_id_idx on notes(place_id);
create index photos_place_id_idx on photos(place_id);
create index place_tags_place_id_idx on place_tags(place_id);
create index place_tags_tag_id_idx on place_tags(tag_id);

-- Updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Apply trigger to places
create trigger update_places_updated_at
  before update on places
  for each row
  execute function update_updated_at_column();

-- Apply trigger to notes
create trigger update_notes_updated_at
  before update on notes
  for each row
  execute function update_updated_at_column();

-- Row Level Security (optional - uncomment if you want to add auth)
-- alter table places enable row level security;
-- alter table notes enable row level security;
-- alter table tags enable row level security;
-- alter table place_tags enable row level security;
-- alter table photos enable row level security;

-- Create storage bucket for photos
-- Run in Supabase Dashboard: Storage > New Bucket > "photos" (public)
