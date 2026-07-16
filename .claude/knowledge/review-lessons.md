# Review Lessons

## [SLS-16640] Pagination "iff" cuma dicek satu arah
Assertion `next_cursor` untuk keyset pagination sering cuma cek 1 arah: "kalau next_cursor
!== null maka items.length harus 20". Arah sebaliknya gak dicek: "kalau items.length === 20
maka next_cursor WAJIB !== null". Bug backend yang truncate 20 row tapi lupa isi next_cursor
(silent data loss / user gak bisa lanjut ke halaman berikutnya) gak ketangkep. Ditemukan
berulang di 3 script: wp-weight-config.contract.mjs, holidays-audit.contract.mjs, dan
target-wp-config-audit.contract.mjs — semua copy pola sama dari `auditPage()`.

Cara benar: `auditPage()` harus assert dua arah: (next_cursor !== null → items.length === 20)
DAN (items.length === 20 → next_cursor !== null). Reviewer WAJIB cek assertion bidirectional
tiap ada spec "X iff Y", bukan cuma satu implikasi.

## Gap: test "parity check" jadi tautologi setelah migrasi selesai
Waktu refactor in-flight (shared module diekstrak tapi consumer lama belum delegate), test
"parity" bandingin implementasi lokal vs shared valid selama dua impl masih independen. Begitu
migrasi kelar (consumer jadi thin wrapper yang manggil shared function), parity test jadi
tautologi: manggil fungsi sama dua kali, selalu match, gak nangkep regresi.

Cara benar: kalau ada ambiguitas status migrasi in-flight pas nulis test, reviewer WAJIB
cross-check state kode aktual (baca file implementasi) sebelum approve, bukan percaya deskripsi
konteks di test doc. Test yang bergantung ke "impl A vs impl B" harus di-recheck tiap review
apakah A dan B masih benar-benar dua implementasi terpisah.

## [SLS-16621] Generic client hook: literal entityType interpolated into URL path

**Kategori**: generalisasi client API hook / naming mismatch entity-vs-route.

**Deskripsi**: `useConfigAuditLog<T>(entityType)` bentuk URL `` `/${entityType}/audit-log` ``
langsung dari `entityType` literal ('wp-weight-config' | 'holiday'). Untuk `holiday` real API
route plural (`/api/holidays/audit-log`), tapi domain/entityType singular → 404 di real request.
Kebetulan `wp-weight-config` match karena entityType == path segment persis. Executor klaim "no
mismatch" tanpa jalanin live request (curl/browser) — tes struktural react-query key saja tidak
cukup, karena `entityType` dipakai ganda: sebagai bagian query key (boleh apa saja, cache-only)
DAN sebagai path segment (harus persis match route Next.js).

**Cara benar**: saat generalize helper yang reuse satu identifier untuk dua tujuan berbeda (cache
key vs URL path), JANGAN asumsikan keduanya selalu sama shape. Buat mapping eksplisit
entityType → path segment (mis. `const API_PATH: Record<ConfigAuditEntityType,string> =
{'wp-weight-config':'wp-weight-config','holiday':'holidays'}`), reviewer WAJIB trace tiap
consumer generic hook ke real route folder (`src/app/api/.../route.ts`) satu-satu, bukan cuma
baca kontrak signature-nya.

## Kategori: Test case tanpa artefak file
qa-executor kadang cuma laporin test case di chat/report tanpa persist jadi file (test/matrix
.md) di repo. Reviewer gak bisa verifikasi assertion-level kalau gak ada file. Cara benar:
SEBELUM cek isi test case, WAJIB grep/glob cari file artefaknya. Kalau gak ketemu tapi ada
sibling pattern serupa (mis. modul lain punya *.contract.test.ts), jadikan acuan struktur file
yang harus diminta ke qa-executor. Jangan review konten kalau artefak filenya gak ada —
NEEDS_REVISION di titik itu juga.

## Kategori: cross-actor audit assertion
Audit/changed_by test sering cuma cek "actor A creates → changed_by=A", lupa cek A creates lalu
B mutates (delete/update) → changed_by harus jadi B, bukan A. Contoh benar:
`holidays-audit.contract.mjs` — Member delete holiday buatan Lead, assert changed_by=memberEmail
bukan leadEmail. Pola ini standar tiap ada audit trail multi-actor.

## [SLS-16667/16668] Derive "current/active" state by value-match against a bare endpoint, not by re-deriving from already-fetched list

**Kategori**: state derivation pattern / redundant network call yang buggy.

**Deskripsi**: `TargetWpConfigPanel` nentuin badge "Aktif" pakai `isActiveConfig()` — deep-equal
`row.rates` vs response `/effective?date=today` (endpoint itu cuma return bare `rates`, tanpa
`id`/`effective_date`). Kalau ada 2 row `rates`-nya byte-identical (past aktif vs future
scheduled, gampang terjadi kalau reuse default value), KEDUA row ke-badge "Aktif" sekaligus —
row future yang belum efektif pun ikut ke-badge aktif. Delete-guard ("disable delete row aktif")
ikut kena bug yang sama karena pakai fungsi yang sama. Root cause: pilih "match-by-value ke hasil
API kedua" padahal server-side selection logic-nya sepele (`getEffectiveRates`: baris
`effective_date <= today` paling baru dari list yang SAMA persis dengan yang sudah difetch
`GET /api/target-wp-config`). Sibling module `WpWeightConfigPanel` justru sudah pakai pendekatan
benar: pure date-comparison client-side (`isFutureWibDate`), tanpa endpoint kedua tanpa
value-match.

**Cara benar**: kalau server selection logic buat "current/effective X" cuma butuh field yang
udah ada di list yang sudah difetch (misal `effective_date <= today`, ambil terbaru), REPLIKASI
logic itu client-side dari list yang ada (`sortedData[0]` yang lolos filter) — jangan fetch
endpoint kedua terus value-match hasilnya ke row. Value-match cuma valid kalau field pembanding
constraint-nya UNIK (misal id/primary key), bukan field non-unique kayak angka rate yang gampang
duplicate. Reviewer WAJIB trace balik ke repository/service buat lihat SELECTION LOGIC asli
sebelum approve pendekatan "badge aktif via endpoint terpisah" — kalau logic itu sepele dan
replikatable dari data yang sudah ada di tangan FE, endpoint kedua + value-match adalah red flag.

## Kategori: cek state RBAC/guard pakai `git show HEAD` doang di ronde eksekusi paralel

qa-executor/reviewer verifikasi status guard route (withAuth vs withLead) cuma via
`git show HEAD` / commit, gak cross-check working tree aktual. Di ronde eksekusi paralel,
be-executor bisa ubah guard di file yang sama TANPA commit dulu (uncommitted working tree change)
di ronde yang sama qa nulis test. Hasil: qa nge-flag "blocking ambiguity" yang sebenarnya udah
resolved di kode aktual, dan biarin existing contract script (target-wp-config-audit.contract.mjs
assert member create 201/delete 204) yang bakal break gak ke-flag sebagai regression konkret.

**Cara benar**: kalau nge-cek state guard/RBAC route buat nulis test case, WAJIB Read file
route.ts aktual di working tree (bukan git show HEAD/committed), apalagi di ronde paralel yang
task lain masih edit file terkait. Kalau beda dari commit, itu bukan ambiguity buat di-ask — itu
fakta baru buat resolve test expectation, dan existing script/dokumentasi (steering, contract
script lain) yang masih rujuk state lama WAJIB ditandai regression konkret yang perlu fix, bukan
cuma "flag, do not touch".
