# Database Migrations

## ⚠️ PENTING: JANGAN BUAT MIGRATION LOKAL LAGI

**Semua migrations HARUS dibuat langsung di Supabase Cloud menggunakan MCP Supabase tools.**

Folder `supabase/migrations/` ini hanya berisi dokumentasi. Semua file migration lokal telah dihapus dan tidak boleh dibuat lagi.

## Status

**Semua migrations dikelola di Supabase Cloud.**

Migrations lokal telah dihapus sepenuhnya. Semua perubahan schema harus dilakukan langsung di Supabase Cloud.

## Migration History di Cloud

Migrations yang ada di Supabase Cloud:
1. `baseline_complete_schema` (20251108053449) - Baseline schema lengkap
2. `add_performance_indexes` (20251108091003) - Performance indexes
3. Security fix migration (20251112144342) - Fix SECURITY DEFINER functions
4. Security fix migration (20251113112034) - Fix SECURITY DEFINER functions (update)
5. Security fix migration (20251113112122) - Fix SECURITY DEFINER functions (final)

**Total: 5 migrations aktif di cloud**

## Schema Overview

Database saat ini memiliki:
- ✅ 9 tabel dengan RLS enabled
- ✅ 11 SECURITY DEFINER functions dengan `SET search_path = public`
- ✅ Semua constraints (PK, FK, CHECK, UNIQUE)
- ✅ Performance indexes
- ✅ RLS policies untuk data isolation

## Cara Menggunakan

### Melihat Migrations di Cloud

Migrations dapat dilihat dan dikelola melalui:
- **MCP Supabase tools** (recommended):
  ```bash
  mcp_supabase_list_migrations --project_id kecpjbrlvaoujdnerhwe
  ```
- Supabase Dashboard → Database → Migrations

### Menambahkan Migration Baru

**HANYA gunakan MCP Supabase untuk membuat migration baru:**

```typescript
// Contoh: Membuat migration baru
mcp_supabase_apply_migration({
  project_id: "kecpjbrlvaoujdnerhwe",
  name: "nama_migration_dalam_snake_case",
  query: "-- SQL migration query di sini"
})
```

**JANGAN:**
- ❌ Membuat file `.sql` di folder `supabase/migrations/`
- ❌ Menggunakan Supabase CLI untuk migration lokal
- ❌ Menjalankan SQL langsung tanpa migration

**HARUS:**
- ✅ Gunakan MCP Supabase tools
- ✅ Atau melalui Supabase Dashboard SQL Editor (untuk quick fixes)
- ✅ Semua perubahan harus melalui migration yang ter-track

## Verifikasi Schema

Setelah perubahan, verifikasi:
- ✅ Semua tabel ada dan RLS enabled
- ✅ Semua functions memiliki `SET search_path = public`
- ✅ Tidak ada error dari security/performance advisors
- ✅ Migration history ter-update di cloud

Untuk verifikasi, gunakan:
```bash
# List semua migrations
mcp_supabase_list_migrations --project_id kecpjbrlvaoujdnerhwe

# List semua tables
mcp_supabase_list_tables --project_id kecpjbrlvaoujdnerhwe

# Check advisors
mcp_supabase_get_advisors --project_id kecpjbrlvaoujdnerhwe --type security
mcp_supabase_get_advisors --project_id kecpjbrlvaoujdnerhwe --type performance
```

## Catatan Penting

### ⛔ Larangan Keras
- **JANGAN** membuat migration files lokal di folder `supabase/migrations/`
- **JANGAN** menggunakan Supabase CLI untuk migration lokal
- **JANGAN** commit file migration `.sql` ke repository

### ✅ Yang Harus Dilakukan
- **HARUS** menggunakan MCP Supabase tools untuk semua perubahan schema
- **HARUS** membuat migration langsung di Supabase Cloud
- **HARUS** verifikasi perubahan dengan advisors setelah migration

### 🔒 Security Best Practices
- Semua SECURITY DEFINER functions harus memiliki `SET search_path = public`
- Semua tables harus memiliki RLS enabled
- Semua user-facing queries harus melalui RLS policies
- Tidak ada hardcoded credentials atau secrets

## Project Information

- **Project ID**: `kecpjbrlvaoujdnerhwe`
- **Project Name**: `prompedia-ai`
- **Region**: `ap-southeast-1`
- **Database Version**: PostgreSQL 17.6.1

---

**Last Updated**: 2025-01-15  
**Migration Strategy**: Cloud-only (Supabase via MCP)  
**Active Migrations**: 5 migrations di cloud  
**Local Migrations**: 0 (semua sudah dihapus)

