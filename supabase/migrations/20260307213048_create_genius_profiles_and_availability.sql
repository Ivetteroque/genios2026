/*
  # Create Genius Profiles and Availability Tables

  1. New Tables
    - `genius_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users, unique)
      - `profile_photo` (text, URL)
      - `full_name` (text)
      - `dni` (varchar(8))
      - `email` (text)
      - `phone` (varchar(9))
      - `description` (text)
      - `instagram` (text, nullable)
      - `facebook` (text, nullable)
      - `tiktok` (text, nullable)
      - `category` (text)
      - `subcategories` (jsonb array)
      - `service_name` (text)
      - `home_location` (jsonb)
      - `coverage_type` (text)
      - `work_locations` (jsonb array)
      - `portfolio` (jsonb array)
      - `documents` (jsonb array)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `genius_profile_drafts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users, unique)
      - `current_step` (integer)
      - `form_data` (jsonb)
      - `last_saved_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `genius_availability`
      - `id` (uuid, primary key)
      - `genius_id` (uuid, foreign key to genius_profiles)
      - `date` (date)
      - `status` (text: 'available', 'full', 'vacation')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create genius_profiles table
CREATE TABLE IF NOT EXISTS genius_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  profile_photo text DEFAULT '',
  full_name text DEFAULT '',
  dni varchar(8) DEFAULT '',
  email text DEFAULT '',
  phone varchar(9) DEFAULT '',
  description text DEFAULT '',
  instagram text,
  facebook text,
  tiktok text,
  category text DEFAULT '',
  subcategories jsonb DEFAULT '[]'::jsonb,
  service_name text DEFAULT '',
  home_location jsonb,
  coverage_type text DEFAULT 'my-district',
  work_locations jsonb DEFAULT '[]'::jsonb,
  portfolio jsonb DEFAULT '[]'::jsonb,
  documents jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on user_id and email
CREATE INDEX IF NOT EXISTS genius_profiles_user_id_idx ON genius_profiles(user_id);
CREATE INDEX IF NOT EXISTS genius_profiles_email_idx ON genius_profiles(email);

-- Enable RLS
ALTER TABLE genius_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for genius_profiles
CREATE POLICY "Users can read own profile"
  ON genius_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON genius_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON genius_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON genius_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create genius_profile_drafts table
CREATE TABLE IF NOT EXISTS genius_profile_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  current_step integer DEFAULT 1,
  form_data jsonb DEFAULT '{}'::jsonb,
  last_saved_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS genius_profile_drafts_user_id_idx ON genius_profile_drafts(user_id);

-- Enable RLS
ALTER TABLE genius_profile_drafts ENABLE ROW LEVEL SECURITY;

-- Policies for genius_profile_drafts
CREATE POLICY "Users can read own draft"
  ON genius_profile_drafts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own draft"
  ON genius_profile_drafts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own draft"
  ON genius_profile_drafts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own draft"
  ON genius_profile_drafts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create genius_availability table
CREATE TABLE IF NOT EXISTS genius_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  genius_id uuid REFERENCES genius_profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  status text NOT NULL CHECK (status IN ('available', 'full', 'vacation')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(genius_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS genius_availability_genius_id_idx ON genius_availability(genius_id);
CREATE INDEX IF NOT EXISTS genius_availability_date_idx ON genius_availability(date);
CREATE INDEX IF NOT EXISTS genius_availability_genius_date_idx ON genius_availability(genius_id, date);

-- Enable RLS
ALTER TABLE genius_availability ENABLE ROW LEVEL SECURITY;

-- Policies for genius_availability
CREATE POLICY "Users can read own availability"
  ON genius_availability FOR SELECT
  TO authenticated
  USING (
    genius_id IN (
      SELECT id FROM genius_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own availability"
  ON genius_availability FOR INSERT
  TO authenticated
  WITH CHECK (
    genius_id IN (
      SELECT id FROM genius_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own availability"
  ON genius_availability FOR UPDATE
  TO authenticated
  USING (
    genius_id IN (
      SELECT id FROM genius_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    genius_id IN (
      SELECT id FROM genius_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own availability"
  ON genius_availability FOR DELETE
  TO authenticated
  USING (
    genius_id IN (
      SELECT id FROM genius_profiles WHERE user_id = auth.uid()
    )
  );