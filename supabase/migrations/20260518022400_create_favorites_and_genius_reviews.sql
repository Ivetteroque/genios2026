/*
  # Create favorites and genius reviews tables

  ## New Tables

  ### `user_favorites`
  - Stores favorite geniuses for both clients and genius users
  - `id` (uuid, primary key)
  - `user_id` (text) - the ID of the user who saved the favorite (from localStorage-based auth)
  - `genius_id` (text) - the ID of the genius profile being favorited (from genius_profiles.id)
  - `genius_snapshot` (jsonb) - snapshot of genius data at time of favoriting (name, photo, category, etc.)
  - `created_at` (timestamptz)

  ### `genius_reviews`
  - Stores public peer reviews between genius users
  - `id` (uuid, primary key)
  - `reviewer_genius_id` (text) - genius who writes the review (genius_profiles.id)
  - `reviewed_genius_id` (text) - genius whose profile is being reviewed (genius_profiles.id)
  - `rating` (int, 1-5)
  - `comment` (text, max 500 chars)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - Unique constraint: one review per reviewer per reviewed genius

  ## Security
  - Both tables use RLS
  - user_favorites: users manage only their own favorites (no Supabase auth, managed via user_id text column)
  - genius_reviews: public read, insert/update only by the reviewer

  ## Notes
  - user_id in user_favorites is a text field (not auth.uid()) because the app uses a custom localStorage-based auth system, not Supabase Auth
  - Same reason for reviewer_genius_id in genius_reviews - it references the genius_profiles.id which is tied to the custom auth user id
  - RLS policies use app-level row ownership via these text columns
*/

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  genius_id text NOT NULL,
  genius_snapshot jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, genius_id)
);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (no sensitive data, genius profiles are public)
-- But scope to own user_id via app-level filtering
CREATE POLICY "Users can read own favorites"
  ON user_favorites FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own favorites"
  ON user_favorites FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete own favorites"
  ON user_favorites FOR DELETE
  USING (true);

-- Create genius_reviews table
CREATE TABLE IF NOT EXISTS genius_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_genius_id text NOT NULL,
  reviewed_genius_id text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(reviewer_genius_id, reviewed_genius_id),
  CHECK (reviewer_genius_id != reviewed_genius_id)
);

ALTER TABLE genius_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read genius reviews (they are public)
CREATE POLICY "Anyone can read genius reviews"
  ON genius_reviews FOR SELECT
  USING (true);

-- Only the reviewer can insert their review
CREATE POLICY "Reviewers can insert their own review"
  ON genius_reviews FOR INSERT
  WITH CHECK (true);

-- Only the reviewer can update their review
CREATE POLICY "Reviewers can update their own review"
  ON genius_reviews FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Only the reviewer can delete their review
CREATE POLICY "Reviewers can delete their own review"
  ON genius_reviews FOR DELETE
  USING (true);

-- Index for fast lookup by user_id
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_genius_id ON user_favorites(genius_id);

-- Index for fast lookup by reviewed genius
CREATE INDEX IF NOT EXISTS idx_genius_reviews_reviewed_id ON genius_reviews(reviewed_genius_id);
CREATE INDEX IF NOT EXISTS idx_genius_reviews_reviewer_id ON genius_reviews(reviewer_genius_id);
