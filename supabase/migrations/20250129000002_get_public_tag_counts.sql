-- Server-side aggregation for public tag counts (replaces client-side counting).
-- Returns tag name and count for all tags used on public prompts.

CREATE OR REPLACE FUNCTION public.get_public_tag_counts()
RETURNS TABLE(name text, count bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT t.name, COUNT(pt.prompt_id)::bigint
  FROM public.tags t
  JOIN public.prompt_tags pt ON pt.tag_id = t.id
  JOIN public.prompts p ON p.id = pt.prompt_id
  WHERE p.is_public = true
  GROUP BY t.id, t.name
  ORDER BY COUNT(pt.prompt_id) DESC;
END;
$$;
