/*
  # Create TryHackMe Rooms Tracker Schema

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique) - Category name like "Intro Rooms", "Linux Fundamentals"
      - `display_order` (integer) - Order to display categories
      - `total_rooms` (integer) - Total number of rooms in category
      - `created_at` (timestamptz)
    
    - `rooms`
      - `id` (uuid, primary key)
      - `title` (text) - Room title
      - `url` (text, unique) - TryHackMe room URL
      - `category_id` (uuid, foreign key to categories)
      - `display_order` (integer) - Order within category
      - `created_at` (timestamptz)
    
    - `user_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `room_id` (uuid, foreign key to rooms)
      - `completed` (boolean, default false)
      - `completed_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - Unique constraint on (user_id, room_id)

  2. Security
    - Enable RLS on all tables
    - Categories and rooms are readable by everyone (including anonymous)
    - Users can only read/write their own progress
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_order integer NOT NULL,
  total_rooms integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text UNIQUE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  display_order integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, room_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_category_id ON rooms(category_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_room_id ON user_progress(room_id);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Policies for categories (readable by everyone)
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  TO public
  USING (true);

-- Policies for rooms (readable by everyone)
CREATE POLICY "Rooms are viewable by everyone"
  ON rooms FOR SELECT
  TO public
  USING (true);

-- Policies for user_progress
CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON user_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);