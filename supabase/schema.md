# Database Schema Documentation

**Project**: Prompedia AI
**Generated**: 2025-12-19

## Tables

### `users`
- **id** (UUID, PK)
- **username** (Text, Unique)
- **display_name** (Text)

### `prompts`
- **id** (UUID, PK)
- **user_id** (UUID, FK)
- **title** (Text)
- **is_public** (Boolean)
- **timestamps**

### `prompt_contents`
- **prompt_id** (UUID, PK/FK)
- **body** (Text)

### `tags`
- **id** (UUID, PK)
- **name** (Text)
- **user_id** (UUID, FK)

### `prompt_tags`
- **prompt_id** (UUID, FK)
- **tag_id** (UUID, FK)

## RLS Summary
- **users**: Public read, Owner write.
- **prompts/contents**: Public read (if flag set), Owner write.
- **tags**: Public read, Owner write.

## Verification
Run `npx supabase db reset` to apply baseline locally.
