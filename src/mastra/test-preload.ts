// Preload `bun test` (lihat bunfig.toml).
//
// `@montez-tstack/env/server` mem-parse SELURUH kontrak env sekali saat modul
// diimport, dan `providers.ts` membekukan header OpenRouter juga saat import.
// Jadi env test wajib ada sebelum modul apa pun dievaluasi — kalau diset di
// dalam file test, file test lain yang jalan lebih dulu sudah men-cache modulnya.
//
// `??=` supaya nilai nyata dari .env / CI tidak ditimpa.
process.env.OPENROUTER_API_KEY ??= "sk-or-test";
process.env.OPENROUTER_SITE_URL ??= "https://montez.example";
process.env.OPENROUTER_MODEL ??= "openai/gpt-4o-mini";

/**
 * Database test. DIPAKSA (bukan `||=`) supaya `bun test` TIDAK MUNGKIN menyentuh
 * database aplikasi — kalau shell atau .env sudah meng-export DATABASE_URL yang
 * menunjuk `montez_ai`, nilai itu wajib kalah di sini.
 *
 * Test yang benar-benar menyentuh DB opt-in lewat TEST_DATABASE_URL (lihat
 * tools/audit/audit-tools.test.ts). Tanpa var itu, nilainya jadi URL buntu dan
 * test tersebut di-skip, bukan gagal.
 */
const TEST_DB = process.env.TEST_DATABASE_URL ?? "postgres://test:test@localhost:5432/montez_test";
process.env.DATABASE_URL = TEST_DB;
process.env.MASTRA_DATABASE_URL = TEST_DB;

// Var wajib lain di kontrak env. Tanpa ini parse gagal dan SEMUA test mati,
// termasuk yang murni (schemas, builtin) yang tak menyentuh DB sama sekali.
//
// `||=` bukan `??=`: .env dev bisa berisi `VAR=` (string KOSONG yang sudah
// "defined"), jadi `??=` tak menimpanya dan env tetap gagal parse.
process.env.BETTER_AUTH_SECRET ||= "test-secret-yang-panjangnya-cukup-32-char";
process.env.BETTER_AUTH_URL ||= "http://localhost:3000";
process.env.CORS_ORIGIN ||= "http://localhost:3001";
process.env.GOOGLE_CLIENT_ID ||= "test-google-client-id";
process.env.GOOGLE_CLIENT_SECRET ||= "test-google-client-secret";
