/*
  # Allow public insert for categories and rooms (for seeding)

  1. Changes
    - Add INSERT policies for categories and rooms tables to allow seeding
    - These policies allow anyone to insert data (needed for initial seeding)
    - In production, you may want to restrict this to admin users only

  2. Security Note
    - These policies are permissive to allow seeding
    - Consider removing or restricting these policies after initial seeding
    - Or use service role key for seeding instead
*/

-- Allow anyone to insert categories (for seeding)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' 
    AND policyname = 'Anyone can insert categories for seeding'
  ) THEN
    CREATE POLICY "Anyone can insert categories for seeding"
      ON categories FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;
END $$;

-- Allow anyone to insert rooms (for seeding)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'rooms' 
    AND policyname = 'Anyone can insert rooms for seeding'
  ) THEN
    CREATE POLICY "Anyone can insert rooms for seeding"
      ON rooms FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;
END $$;