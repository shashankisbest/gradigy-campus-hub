-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('student', 'faculty');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create resources table
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  link TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Resources policies
CREATE POLICY "Anyone can view resources"
  ON resources FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Faculty can insert resources"
  ON resources FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'faculty'
    )
  );

CREATE POLICY "Faculty can update own resources"
  ON resources FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid());

CREATE POLICY "Faculty can delete own resources"
  ON resources FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Create timetable table
CREATE TABLE timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day TEXT NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject TEXT NOT NULL,
  faculty_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;

-- Timetable policies
CREATE POLICY "Anyone can view timetable"
  ON timetable FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Faculty can insert timetable entries"
  ON timetable FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'faculty'
    )
  );

CREATE POLICY "Faculty can update own timetable entries"
  ON timetable FOR UPDATE
  TO authenticated
  USING (faculty_id = auth.uid());

CREATE POLICY "Faculty can delete own timetable entries"
  ON timetable FOR DELETE
  TO authenticated
  USING (faculty_id = auth.uid());

-- Create scholarships table
CREATE TABLE scholarships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  link TEXT NOT NULL,
  added_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;

-- Scholarships policies
CREATE POLICY "Anyone can view scholarships"
  ON scholarships FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Faculty can insert scholarships"
  ON scholarships FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'faculty'
    )
  );

CREATE POLICY "Faculty can update own scholarships"
  ON scholarships FOR UPDATE
  TO authenticated
  USING (added_by = auth.uid());

CREATE POLICY "Faculty can delete own scholarships"
  ON scholarships FOR DELETE
  TO authenticated
  USING (added_by = auth.uid());

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();