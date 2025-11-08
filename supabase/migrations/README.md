# Database Migrations

## Status

**Semua migrations sekarang dikelola di Supabase Cloud.**

Migrations lokal telah dihapus dan digantikan dengan baseline migration di cloud Supabase.

## Baseline Migration

Baseline migration lengkap telah diupload ke Supabase dengan nama: `baseline_complete_schema` (version: `20251108053449`)

Migration ini berisi:
- ✅ Semua tabel dengan struktur final
- ✅ Semua constraints (PK, FK, CHECK, UNIQUE)
- ✅ Semua indexes
- ✅ RLS enabled pada semua tabel
- ✅ Semua RLS policies
- ✅ Semua functions (SECURITY DEFINER)

## Migration History Cleanup

**Semua migration incremental telah dihapus dari cloud.**

Hanya baseline migration yang tersisa di migration history. Ini karena:
- Baseline migration sudah mencakup semua perubahan dari migrations sebelumnya
- Migration history yang lama tidak diperlukan lagi
- Database structure tetap utuh dan tidak terpengaruh

## Cara Menggunakan

### Melihat Migrations di Cloud

Migrations dapat dilihat dan dikelola melalui:
- Supabase Dashboard → Database → Migrations
- MCP Supabase tools

Saat ini hanya ada 1 migration: `baseline_complete_schema`

### Menambahkan Migration Baru

Untuk menambahkan migration baru, gunakan MCP Supabase:

```bash
# Apply migration baru
mcp_supabase_apply_migration
```

Atau melalui Supabase Dashboard.

Migration baru akan ditambahkan setelah baseline migration.

## Verifikasi

Setelah cleanup, verifikasi:
- ✅ Hanya 1 migration di history (baseline)
- ✅ Semua 9 tabel ada dan RLS enabled
- ✅ Semua 8 functions terdefinisi
- ✅ Semua 31 RLS policies aktif
- ✅ Semua 11 foreign keys aktif
- ✅ Tidak ada error dari security/performance advisors

## Catatan Penting

- **Jangan** membuat migration files lokal lagi
- Semua perubahan database harus melalui Supabase cloud migrations
- Baseline migration sudah idempotent (menggunakan IF NOT EXISTS) sehingga aman dijalankan berulang kali
- Migration history sudah dibersihkan - hanya baseline yang tersisa

---

**Last Updated**: 2025-01-27  
**Migration Strategy**: Cloud-only (Supabase)  
**Active Migrations**: 1 (baseline_complete_schema)

