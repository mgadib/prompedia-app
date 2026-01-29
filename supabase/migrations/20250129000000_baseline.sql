-- Baseline schema for Prompedia
-- Tables: tags, prompts, prompt_contents, prompt_tags
-- public.users is expected to be synced from auth.users (id, username, display_name)

-- Tags: global, case-insensitive by lower(name)
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS tags_name_lower_key ON public.tags (lower(name));

-- Prompts: owned by user_id (auth.users)
CREATE TABLE IF NOT EXISTS public.prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS prompts_user_id_idx ON public.prompts (user_id);
CREATE INDEX IF NOT EXISTS prompts_is_public_created_at_idx ON public.prompts (is_public, created_at DESC);

-- Prompt content: 1:1 with prompt
CREATE TABLE IF NOT EXISTS public.prompt_contents (
  prompt_id uuid PRIMARY KEY REFERENCES public.prompts(id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Prompt-tag junction
CREATE TABLE IF NOT EXISTS public.prompt_tags (
  prompt_id uuid NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (prompt_id, tag_id)
);

CREATE INDEX IF NOT EXISTS prompt_tags_tag_id_idx ON public.prompt_tags (tag_id);

-- public.users: profile data for display (synced from auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  display_name text
);

-- Sync new auth user to public.users (call from app or trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'email', split_part(NEW.email, '@', 1), 'user'),
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_tags ENABLE ROW LEVEL SECURITY;

-- Policies: users can manage own prompts; anyone can read public prompts and tags
CREATE POLICY "Users can do all on own prompts"
  ON public.prompts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read public prompts"
  ON public.prompts FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can do all on own prompt_contents"
  ON public.prompt_contents FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.prompts p WHERE p.id = prompt_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.prompts p WHERE p.id = prompt_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Users can do all on own prompt_tags"
  ON public.prompt_tags FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.prompts p WHERE p.id = prompt_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.prompts p WHERE p.id = prompt_id AND p.user_id = auth.uid())
  );

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read users (for author display)"
  ON public.users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can read tags"
  ON public.tags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert tags"
  ON public.tags FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
