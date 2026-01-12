-- Migration: Add search_public_prompts function for server-side filtering and pagination
-- Similar to search_prompts but for public prompts accessible without authentication

-- Create function to search public prompts with tag filtering and pagination
CREATE OR REPLACE FUNCTION public.search_public_prompts(
    p_tag_filter TEXT DEFAULT NULL,
    p_page INTEGER DEFAULT 1,
    p_page_size INTEGER DEFAULT 10
)
RETURNS TABLE(
    id UUID,
    user_id UUID,
    title TEXT,
    is_public BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    prompt_contents JSONB,
    prompt_tags JSONB,
    users JSONB,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_offset INTEGER;
BEGIN
    -- Calculate offset
    v_offset := (p_page - 1) * p_page_size;

    RETURN QUERY
    WITH filtered_prompts AS (
        SELECT DISTINCT p.id
        FROM public.prompts p
        LEFT JOIN public.prompt_tags pt ON p.id = pt.prompt_id
        LEFT JOIN public.tags t ON pt.tag_id = t.id
        WHERE 
            -- Only public prompts
            p.is_public = true
            -- Tag filter (exact match on tag name)
            AND (
                p_tag_filter IS NULL OR 
                p_tag_filter = '' OR
                EXISTS (
                    SELECT 1 
                    FROM public.prompt_tags pt2
                    INNER JOIN public.tags t2 ON pt2.tag_id = t2.id
                    WHERE pt2.prompt_id = p.id 
                    AND LOWER(t2.name) = LOWER(p_tag_filter)
                )
            )
    ),
    total_count AS (
        SELECT COUNT(*)::BIGINT as cnt FROM filtered_prompts
    ),
    paginated_prompts AS (
        SELECT fp.id
        FROM filtered_prompts fp
        INNER JOIN public.prompts p ON fp.id = p.id
        ORDER BY p.created_at DESC
        LIMIT p_page_size
        OFFSET v_offset
    )
    SELECT 
        p.id,
        p.user_id,
        p.title,
        p.is_public,
        p.created_at,
        p.updated_at,
        -- Aggregate prompt_contents as JSONB
        COALESCE(
            jsonb_build_object(
                'body', pc.body
            ),
            'null'::jsonb
        ) as prompt_contents,
        -- Aggregate prompt_tags with tags as JSONB array
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'tags', jsonb_build_object(
                            'id', t.id,
                            'name', t.name
                        )
                    )
                )
                FROM public.prompt_tags pt
                LEFT JOIN public.tags t ON pt.tag_id = t.id
                WHERE pt.prompt_id = p.id AND t.id IS NOT NULL
            ),
            '[]'::jsonb
        ) as prompt_tags,
        -- Users data as JSONB
        COALESCE(
            jsonb_build_object(
                'username', u.username,
                'display_name', u.display_name
            ),
            'null'::jsonb
        ) as users,
        -- Total count from CTE
        (SELECT cnt FROM total_count) as total_count
    FROM paginated_prompts pp
    INNER JOIN public.prompts p ON pp.id = p.id
    LEFT JOIN public.prompt_contents pc ON p.id = pc.prompt_id
    LEFT JOIN public.users u ON p.user_id = u.id
    ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.search_public_prompts TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_public_prompts TO anon;
