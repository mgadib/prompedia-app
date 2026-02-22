-- Search functions hardening: auth.uid() validation + pagination cap (max 100)

CREATE OR REPLACE FUNCTION public.search_prompts(
  p_user_id uuid,
  p_search_text text DEFAULT NULL,
  p_tag_filter text DEFAULT NULL,
  p_visibility text DEFAULT 'all',
  p_page int DEFAULT 1,
  p_page_size int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  is_public boolean,
  created_at timestamptz,
  updated_at timestamptz,
  prompt_contents jsonb,
  prompt_tags jsonb,
  users jsonb,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page_size int;
  v_offset int;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  v_page_size := LEAST(greatest(COALESCE(p_page_size, 10), 1), 100);
  v_offset := (greatest(p_page, 1) - 1) * v_page_size;

  RETURN QUERY
  WITH filtered AS (
    SELECT p.id, p.user_id, p.title, p.is_public, p.created_at, p.updated_at,
      (SELECT jsonb_build_object('body', pc.body) FROM public.prompt_contents pc WHERE pc.prompt_id = p.id LIMIT 1) AS pc,
      (SELECT jsonb_agg(jsonb_build_object('tags', jsonb_build_object('id', t.id, 'name', t.name)))
       FROM public.prompt_tags pt JOIN public.tags t ON t.id = pt.tag_id WHERE pt.prompt_id = p.id) AS pt,
      (SELECT jsonb_build_object('username', u.username, 'display_name', u.display_name)
       FROM public.users u WHERE u.id = p.user_id) AS u,
      count(*) OVER() AS cnt
    FROM public.prompts p
    WHERE p.user_id = p_user_id
      AND (p_visibility = 'all' OR (p_visibility = 'public' AND p.is_public) OR (p_visibility = 'private' AND NOT p.is_public))
      AND (p_search_text IS NULL OR p_search_text = '' OR p.title ILIKE '%' || p_search_text || '%'
           OR EXISTS (SELECT 1 FROM public.prompt_contents c WHERE c.prompt_id = p.id AND c.body ILIKE '%' || p_search_text || '%'))
      AND (p_tag_filter IS NULL OR p_tag_filter = '' OR EXISTS (
        SELECT 1 FROM public.prompt_tags pt2 JOIN public.tags t2 ON t2.id = pt2.tag_id
        WHERE pt2.prompt_id = p.id AND lower(t2.name) = lower(p_tag_filter)
      ))
  )
  SELECT f.id, f.user_id, f.title, f.is_public, f.created_at, f.updated_at,
    f.pc, f.pt, f.u, f.cnt
  FROM filtered f
  ORDER BY f.updated_at DESC
  OFFSET v_offset
  LIMIT v_page_size;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_public_prompts(
  p_tag_filter text DEFAULT NULL,
  p_page int DEFAULT 1,
  p_page_size int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  is_public boolean,
  created_at timestamptz,
  updated_at timestamptz,
  prompt_contents jsonb,
  prompt_tags jsonb,
  users jsonb,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page_size int;
  v_offset int;
BEGIN
  v_page_size := LEAST(greatest(COALESCE(p_page_size, 10), 1), 100);
  v_offset := (greatest(p_page, 1) - 1) * v_page_size;

  RETURN QUERY
  WITH filtered AS (
    SELECT p.id, p.user_id, p.title, p.is_public, p.created_at, p.updated_at,
      (SELECT jsonb_build_object('body', pc.body) FROM public.prompt_contents pc WHERE pc.prompt_id = p.id LIMIT 1) AS pc,
      (SELECT jsonb_agg(jsonb_build_object('tags', jsonb_build_object('id', t.id, 'name', t.name)))
       FROM public.prompt_tags pt JOIN public.tags t ON t.id = pt.tag_id WHERE pt.prompt_id = p.id) AS pt,
      (SELECT jsonb_build_object('username', u.username, 'display_name', u.display_name)
       FROM public.users u WHERE u.id = p.user_id) AS u,
      count(*) OVER() AS cnt
    FROM public.prompts p
    WHERE p.is_public = true
      AND (p_tag_filter IS NULL OR p_tag_filter = '' OR EXISTS (
        SELECT 1 FROM public.prompt_tags pt2 JOIN public.tags t2 ON t2.id = pt2.tag_id
        WHERE pt2.prompt_id = p.id AND lower(t2.name) = lower(p_tag_filter)
      ))
  )
  SELECT f.id, f.user_id, f.title, f.is_public, f.created_at, f.updated_at,
    f.pc, f.pt, f.u, f.cnt
  FROM filtered f
  ORDER BY f.created_at DESC
  OFFSET v_offset
  LIMIT v_page_size;
END;
$$;
