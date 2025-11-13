-- Fix security vulnerability: Add SET search_path to all SECURITY DEFINER functions
-- This prevents schema injection attacks

-- Drop existing triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;

-- 1. handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 2. handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, username, display_name)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'display_name'
    );
    RETURN NEW;
END;
$$;

-- 3. get_user_usage
CREATE OR REPLACE FUNCTION public.get_user_usage(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    usage_record RECORD;
    daily_limit INTEGER := 27;
    current_date DATE := CURRENT_DATE;
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID is required for authenticated user usage';
    END IF;

    SELECT * INTO usage_record
    FROM public.ai_usage
    WHERE user_id = p_user_id
      AND is_guest = false
      AND usage_date = current_date
    LIMIT 1;

    IF usage_record.id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'usage_count', usage_record.usage_count,
            'daily_limit', daily_limit,
            'remaining', daily_limit - usage_record.usage_count,
            'last_used_at', usage_record.last_used_at,
            'user_id', usage_record.user_id
        );
    ELSE
        RETURN jsonb_build_object(
            'usage_count', 0,
            'daily_limit', daily_limit,
            'remaining', daily_limit,
            'last_used_at', NULL,
            'user_id', p_user_id
        );
    END IF;
END;
$$;

-- 4. increment_ai_usage
CREATE OR REPLACE FUNCTION public.increment_ai_usage(p_user_id uuid DEFAULT NULL::uuid, p_is_guest boolean DEFAULT false, p_session_id text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    usage_record RECORD;
    new_count INTEGER;
    daily_limit INTEGER;
    current_date DATE := CURRENT_DATE;
BEGIN
    IF p_is_guest THEN
        daily_limit := 7;
    ELSE
        daily_limit := 27;
    END IF;

    SELECT * INTO usage_record
    FROM public.ai_usage
    WHERE (user_id = p_user_id OR (is_guest = p_is_guest AND session_id = p_session_id))
      AND usage_date = current_date
    LIMIT 1;

    IF usage_record.id IS NOT NULL THEN
        IF usage_record.usage_count >= daily_limit THEN
            RETURN jsonb_build_object(
                'success', false,
                'usage_count', usage_record.usage_count,
                'daily_limit', daily_limit,
                'remaining', 0,
                'error', 'Daily limit exceeded'
            );
        END IF;

        new_count := usage_record.usage_count + 1;

        UPDATE public.ai_usage
        SET
            usage_count = new_count,
            last_used_at = TIMEZONE('utc'::text, NOW()),
            updated_at = TIMEZONE('utc'::text, NOW())
        WHERE id = usage_record.id;

    ELSE
        new_count := 1;

        INSERT INTO public.ai_usage (
            user_id,
            usage_date,
            usage_count,
            is_guest,
            session_id,
            last_used_at
        ) VALUES (
            p_user_id,
            current_date,
            new_count,
            p_is_guest,
            p_session_id,
            TIMEZONE('utc'::text, NOW())
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'usage_count', new_count,
        'daily_limit', daily_limit,
        'remaining', daily_limit - new_count
    );
END;
$$;

-- 5. get_guest_usage
CREATE OR REPLACE FUNCTION public.get_guest_usage(p_session_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    usage_record RECORD;
    daily_limit INTEGER := 7;
    current_date DATE := CURRENT_DATE;
BEGIN
    IF p_session_id IS NULL OR p_session_id = '' THEN
        RAISE EXCEPTION 'Session ID is required for guest usage';
    END IF;

    SELECT * INTO usage_record
    FROM public.ai_usage
    WHERE is_guest = true
      AND session_id = p_session_id
      AND usage_date = current_date
    LIMIT 1;

    IF usage_record.id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'usage_count', usage_record.usage_count,
            'daily_limit', daily_limit,
            'remaining', daily_limit - usage_record.usage_count,
            'last_used_at', usage_record.last_used_at,
            'session_id', usage_record.session_id
        );
    ELSE
        RETURN jsonb_build_object(
            'usage_count', 0,
            'daily_limit', daily_limit,
            'remaining', daily_limit,
            'last_used_at', NULL,
            'session_id', p_session_id
        );
    END IF;
END;
$$;

-- 6. get_current_usage
CREATE OR REPLACE FUNCTION public.get_current_usage(p_user_id uuid DEFAULT NULL::uuid, p_is_guest boolean DEFAULT false, p_session_id text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    usage_record RECORD;
    daily_limit INTEGER;
    current_date DATE := CURRENT_DATE;
BEGIN
    IF p_is_guest THEN
        daily_limit := 7;
    ELSE
        daily_limit := 27;
    END IF;

    SELECT * INTO usage_record
    FROM public.ai_usage
    WHERE (user_id = p_user_id OR (is_guest = p_is_guest AND session_id = p_session_id))
      AND usage_date = current_date
    LIMIT 1;

    IF usage_record.id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'usage_count', usage_record.usage_count,
            'daily_limit', daily_limit,
            'remaining', daily_limit - usage_record.usage_count,
            'last_used_at', usage_record.last_used_at,
            'session_id', usage_record.session_id
        );
    ELSE
        RETURN jsonb_build_object(
            'usage_count', 0,
            'daily_limit', daily_limit,
            'remaining', daily_limit,
            'last_used_at', NULL,
            'session_id', p_session_id
        );
    END IF;
END;
$$;

-- 7. track_guest_usage
CREATE OR REPLACE FUNCTION public.track_guest_usage(p_session_id text, p_ip_address text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usage_count integer;
  v_daily_limit integer := 7;
  v_remaining integer;
BEGIN
  INSERT INTO guest_sessions (session_id, ip_address, user_agent, usage_count)
  VALUES (p_session_id, p_ip_address, p_user_agent, 1)
  ON CONFLICT (session_id) 
  DO UPDATE SET
    usage_count = CASE
      WHEN guest_sessions.usage_date = CURRENT_DATE 
      THEN guest_sessions.usage_count + 1
      ELSE 1
    END,
    usage_date = CURRENT_DATE,
    last_used_at = now()
  RETURNING usage_count INTO v_usage_count;

  v_remaining := v_daily_limit - v_usage_count;

  RETURN json_build_object(
    'success', v_remaining >= 0,
    'usage_count', v_usage_count,
    'daily_limit', v_daily_limit,
    'remaining', GREATEST(0, v_remaining)
  );
END;
$$;

-- 8. increment_user_usage
CREATE OR REPLACE FUNCTION public.increment_user_usage(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    usage_record RECORD;
    new_count INTEGER;
    daily_limit INTEGER := 27;
    current_date DATE := CURRENT_DATE;
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID is required for authenticated user usage';
    END IF;

    SELECT * INTO usage_record
    FROM public.ai_usage
    WHERE user_id = p_user_id
      AND is_guest = false
      AND usage_date = current_date
    LIMIT 1;

    IF usage_record.id IS NOT NULL THEN
        IF usage_record.usage_count >= daily_limit THEN
            RETURN jsonb_build_object(
                'success', false,
                'usage_count', usage_record.usage_count,
                'daily_limit', daily_limit,
                'remaining', 0,
                'error', 'Daily limit exceeded'
            );
        END IF;

        new_count := usage_record.usage_count + 1;

        UPDATE public.ai_usage
        SET
            usage_count = new_count,
            last_used_at = TIMEZONE('utc'::text, NOW()),
            updated_at = TIMEZONE('utc'::text, NOW())
        WHERE id = usage_record.id;

    ELSE
        new_count := 1;

        INSERT INTO public.ai_usage (
            user_id,
            usage_date,
            usage_count,
            is_guest,
            last_used_at
        ) VALUES (
            p_user_id,
            current_date,
            new_count,
            false,
            TIMEZONE('utc'::text, NOW())
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'usage_count', new_count,
        'daily_limit', daily_limit,
        'remaining', daily_limit - new_count
    );
END;
$$;

-- 9. reset_daily_usage
CREATE OR REPLACE FUNCTION public.reset_daily_usage()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    reset_count INTEGER;
    jakarta_time TIMESTAMP WITH TIME ZONE;
BEGIN
    jakarta_time := CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta';

    IF EXTRACT(HOUR FROM jakarta_time) >= 0 THEN
        DELETE FROM public.ai_usage
        WHERE usage_date < CURRENT_DATE;

        GET DIAGNOSTICS reset_count = ROW_COUNT;

        RAISE NOTICE 'Daily usage reset completed. Deleted % records', reset_count;

        RETURN reset_count;
    END IF;

    RETURN 0;
END;
$$;

-- 10. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 11. increment_guest_usage
CREATE OR REPLACE FUNCTION public.increment_guest_usage(p_session_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    usage_record RECORD;
    new_count INTEGER;
    daily_limit INTEGER := 7;
    current_date DATE := CURRENT_DATE;
BEGIN
    IF p_session_id IS NULL OR p_session_id = '' THEN
        RAISE EXCEPTION 'Session ID is required for guest usage';
    END IF;

    SELECT * INTO usage_record
    FROM public.ai_usage
    WHERE is_guest = true
      AND session_id = p_session_id
      AND usage_date = current_date
    LIMIT 1;

    IF usage_record.id IS NOT NULL THEN
        IF usage_record.usage_count >= daily_limit THEN
            RETURN jsonb_build_object(
                'success', false,
                'usage_count', usage_record.usage_count,
                'daily_limit', daily_limit,
                'remaining', 0,
                'error', 'Daily limit exceeded'
            );
        END IF;

        new_count := usage_record.usage_count + 1;

        UPDATE public.ai_usage
        SET
            usage_count = new_count,
            last_used_at = TIMEZONE('utc'::text, NOW()),
            updated_at = TIMEZONE('utc'::text, NOW())
        WHERE id = usage_record.id;

    ELSE
        new_count := 1;

        INSERT INTO public.ai_usage (
            usage_date,
            usage_count,
            is_guest,
            session_id,
            last_used_at
        ) VALUES (
            current_date,
            new_count,
            true,
            p_session_id,
            TIMEZONE('utc'::text, NOW())
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'usage_count', new_count,
        'daily_limit', daily_limit,
        'remaining', daily_limit - new_count
    );
END;
$$;

-- Recreate triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();