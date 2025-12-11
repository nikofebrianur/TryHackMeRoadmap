/*
  # Fix Security and Performance Issues

  1. RLS Policy Optimizations
    - Replace direct auth.uid() calls with (SELECT auth.uid()) in all user_progress policies
    - This improves performance by calling the function once instead of for each row

  2. Index Cleanup
    - Remove unused indexes: idx_user_progress_room_id and idx_rooms_category_id
    - These indexes are not needed for current query patterns

  3. Security
    - All RLS policies now optimized for performance
    - Direct auth.uid() calls replaced with SELECT wrapper
*/

-- Drop existing policies that need to be recreated with optimized calls
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can delete own progress" ON user_progress;

-- Recreate policies with optimized auth.uid() calls wrapped in SELECT
CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own progress"
  ON user_progress FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Drop unused indexes
DROP INDEX IF EXISTS idx_user_progress_room_id;
DROP INDEX IF EXISTS idx_rooms_category_id;