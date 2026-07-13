# Test Case — QA-2 (SLS-16502): Configuration Menu Navigation Grouping

**Feature**: Configuration Menu Navigation Grouping (Phase 1 MVP)
**Scope**: QA parity + cross-feature regression untuk FE-2 (route/tab shell configuration + Holiday reuse)
**Route under test**: `/dashboard/configuration` (tabs: Holiday, WP Weight, Target WP, Audit Log)
**Legacy route**: `/dashboard/holiday-management`

## Ambiguitas / Perlu Klarifikasi

1. AC hanya sebut "Lead & Member" untuk redirect `/dashboard/holiday-management`. Role lain (jika ada, misal Admin) belum eksplisit — TC ditulis untuk Lead & Member saja sesuai AC, tidak diperluas.
2. Urutan tab default (Holiday di posisi pertama) diasumsikan dari AC "default /dashboard/configuration" — tidak ada spek urutan 3 tab stub lainnya (WP Weight, Target WP, Audit Log). Test tidak mengunci urutan tab stub, hanya keberadaan & isi "coming soon".
3. Definisi persis "coming soon" (copy text, komponen placeholder) tidak dirinci di AC — TC hanya assert render tanpa crash + tidak ada network call baru, bukan assert copy text exact match. Tandai ke reviewer/dev jika ada expected copy spesifik.
4. Redirect Member "lanjut ke /dashboard" — kontrak: RoleBasedRoute (route guard level komponen) memblokir Member penuh dari `/dashboard/configuration`, redirect ke root `/dashboard`. Bukan open question.

---

## TC-01 — Holiday tab default render (positive, parity)

```gherkin
Given user login sebagai Lead
And user belum pernah set query param tab
When user navigasi ke /dashboard/configuration
Then tab Holiday aktif secara default (highlighted/selected)
And konten yang tampil sama seperti halaman /dashboard/holiday-management lama (list/calendar holiday ter-render)
```
Tag: positive, parity, smoke

---

## TC-02 — Create holiday via tab Holiday parity dengan legacy (positive, parity)

```gherkin
Given Lead berada di /dashboard/configuration?tab=holiday
When user klik "Add Holiday", isi form (nama, tanggal, tipe) valid, submit
Then holiday baru tersimpan dan muncul di list/calendar
And behavior (validasi field, response sukses, toast/notifikasi) identik dengan /dashboard/holiday-management legacy
```
Precondition: user punya akses create holiday.
Tag: positive, parity

---

## TC-03 — Edit holiday via tab Holiday parity dengan legacy (positive, parity)

```gherkin
Given Lead berada di tab Holiday, minimal 1 data holiday sudah ada
When user pilih holiday existing, ubah field (nama/tanggal), simpan
Then data ter-update dan reflect di list/calendar
And behavior identik dengan legacy holiday-management (termasuk validasi konflik tanggal jika ada)
```
Tag: positive, parity

---

## TC-04 — Delete holiday via tab Holiday parity dengan legacy (positive, parity)

```gherkin
Given Lead berada di tab Holiday, minimal 1 data holiday ada
When user hapus 1 holiday (konfirmasi delete)
Then data hilang dari list/calendar setelah konfirmasi
And behavior (confirm dialog, response) identik dengan legacy
```
Tag: positive, parity

---

## TC-05 — Bulk insert holiday via tab Holiday parity dengan legacy (positive, parity)

```gherkin
Given Lead berada di tab Holiday
When user gunakan fitur bulk insert (upload/paste multiple holiday), submit
Then semua holiday valid tersimpan, error row (jika ada) ter-report sama seperti legacy
And jumlah data & pesan hasil bulk insert identik dengan legacy holiday-management
```
Tag: positive, parity

---

## TC-06 — Calendar view holiday parity dengan legacy (positive, parity)

```gherkin
Given Lead berada di tab Holiday
When user switch ke calendar view (jika ada toggle list/calendar)
Then holiday ter-render di tanggal yang benar pada calendar
And tampilan/interaksi calendar (navigasi bulan, klik tanggal) identik dengan legacy
```
Tag: positive, parity

---

## TC-07 — Talent Leave smoke check: holiday display tidak rusak (positive, regression, smoke-only)

```gherkin
Given fitur Talent Leave (halaman /dashboard/talent-leave) menggunakan hook holiday yang sama
When user buka halaman Talent Leave pasca perubahan configuration menu
Then tanggal libur (holiday) tetap tampil benar di calendar Talent Leave (highlight/marker tidak hilang atau salah tanggal)
And tidak ada error console/crash terkait holiday data di Talent Leave
```
Precondition/batasan: SMOKE check saja — tidak boleh expand ke full regression suite Talent Leave (leave CRUD, export, dll di luar scope ini). Tidak boleh modifikasi `useHolidayQueries.ts` atau file `features/holiday-management/**` selama repro; kalau nemu defect, lapor via bug ticket.
Tag: positive, regression, smoke

---

## TC-08 — Tab stub "WP Weight" render coming soon tanpa crash & tanpa network call baru (positive, negative-network)

```gherkin
Given Lead berada di /dashboard/configuration
When user klik tab "WP Weight"
Then halaman render placeholder "coming soon" (tidak crash, tidak blank/error boundary)
And Network tab browser TIDAK menunjukkan request baru ke endpoint WP Weight config (mis. /api/wp-weight-config atau sejenis) yang belum diimplementasi untuk shell ini
```
Verification method: buka DevTools Network tab sebelum klik, klik tab, assert 0 request baru selain aset statis yang sudah ada.
Tag: positive, negative (no unintended network call)

---

## TC-09 — Tab stub "Target WP" render coming soon tanpa crash & tanpa network call baru (positive, negative-network)

```gherkin
Given Lead berada di /dashboard/configuration
When user klik tab "Target WP"
Then halaman render placeholder "coming soon" tanpa crash
And tidak ada request network baru ke endpoint Target WP config (mis. /api/target-wp-config) yang di-trigger oleh shell konfigurasi
```
Tag: positive, negative (no unintended network call)

---

## TC-10 — Tab stub "Audit Log" render coming soon tanpa crash & tanpa network call baru (positive, negative-network)

```gherkin
Given Lead berada di /dashboard/configuration
When user klik tab "Audit Log"
Then halaman render placeholder "coming soon" tanpa crash
And tidak ada request network baru ke endpoint audit log manapun
```
Tag: positive, negative (no unintended network call)

---

## TC-11 — Tab switch tanpa full page reload (positive, technical/regression)

```gherkin
Given Lead berada di /dashboard/configuration, tab Holiday aktif
When user klik tab lain (WP Weight/Target WP/Audit Log) lalu klik kembali ke Holiday
Then Network tab TIDAK menunjukkan request dokumen HTML baru (no full navigation/document reload) — hanya client-side state/URL change
And state/data holiday yang sudah di-fetch sebelumnya tidak hilang/reset tidak wajar (tidak perlu re-fetch dari awal kecuali by design)
```
Verification method: DevTools Network tab, filter by type "document" — assert hanya 1 document request (initial load), tidak ada tambahan saat switch tab.
Tag: positive, regression

---

## TC-12 — Query param ?tab= invalid fallback ke Holiday, no crash (negative)

```gherkin
Given Lead mengakses URL langsung
When user navigasi ke /dashboard/configuration?tab=foobar (nilai tidak dikenal)
Then aplikasi TIDAK crash dan TIDAK menampilkan error 500/blank page
And tab yang aktif fallback ke Holiday (default)
```
Tag: negative

---

## TC-13 — Query param ?tab= kosong/tanpa value fallback ke Holiday (negative, edge case)

```gherkin
Given Lead mengakses URL langsung
When user navigasi ke /dashboard/configuration?tab= (value kosong) atau /dashboard/configuration?tab (tanpa "=")
Then aplikasi tidak crash, fallback ke tab Holiday
```
Tag: negative, edge case

---

## TC-14 — Query param ?tab= case-sensitivity / whitespace (negative, edge case)

```gherkin
Given Lead mengakses URL langsung
When user navigasi ke /dashboard/configuration?tab=HOLIDAY (uppercase) atau ?tab=%20holiday (dengan whitespace/encoded space)
Then behavior konsisten: baik ter-treat sebagai valid (tab Holiday aktif) ATAU fallback ke Holiday — TIDAK BOLEH crash/blank
```
Catatan: expected exact behavior (strict match vs case-insensitive) tidak eksplisit di AC — tandai sebagai temuan ke dev/reviewer jika implementasi berbeda dari salah satu opsi di atas.
Tag: negative, edge case, ambiguous-flagged

---

## TC-15 — Redirect /dashboard/holiday-management untuk role Lead (positive)

```gherkin
Given user login sebagai Lead
When user akses URL /dashboard/holiday-management (langsung atau via bookmark/deep link)
Then user di-redirect ke /dashboard/configuration?tab=holiday
And konten tab Holiday ter-render normal setelah redirect (bukan blank/loading infinite)
```
Tag: positive, regression

---

## TC-16 — Redirect /dashboard/holiday-management untuk role Member (positive)

```gherkin
Given user login sebagai Member (non-Lead)
When user akses URL /dashboard/holiday-management (langsung atau via bookmark/deep link)
Then user di-redirect ke /dashboard (root dashboard) — BUKAN ke /dashboard/configuration
And tidak ada error/crash selama proses redirect
```
Tag: positive, negative (access control), regression

---

## TC-17 — Member akses langsung /dashboard/configuration (negative, access control)

```gherkin
Given user login sebagai Member
When user akses langsung URL /dashboard/configuration (tanpa lewat holiday-management)
Then RoleBasedRoute memblokir akses dan redirect ke /dashboard (root dashboard)
And tidak ada flash/leak konten configuration sebelum redirect terjadi
```
Tag: negative, access control

---

## TC-18 — Unauthenticated user akses /dashboard/configuration (negative, security)

```gherkin
Given user belum login (no valid session)
When user akses /dashboard/configuration (dengan atau tanpa query tab)
Then user di-redirect ke halaman login, TIDAK ada konten configuration/holiday yang bocor sebelum redirect
```
Tag: negative, security

---

## TC-19 — Browser back/forward setelah tab switch (edge case, regression)

```gherkin
Given Lead berada di /dashboard/configuration?tab=holiday
When user klik tab WP Weight (URL berubah ke ?tab=wp-weight), lalu tekan browser Back
Then URL & tab aktif kembali ke Holiday (?tab=holiday) tanpa crash
And tidak terjadi full page reload (masih SPA navigation)
```
Tag: edge case, regression

---

## TC-20 — Refresh halaman saat tab non-default aktif (edge case)

```gherkin
Given Lead berada di /dashboard/configuration?tab=audit-log (tab stub aktif)
When user melakukan hard refresh (F5/reload)
Then setelah reload, tab Audit Log tetap aktif (state preserved via query param) dan render "coming soon" tanpa crash
```
Tag: edge case

---

## Ringkasan Coverage

| Area | Jumlah TC | TC ID |
|---|---|---|
| Holiday CRUD/calendar parity vs legacy | 6 | TC-01–TC-06 |
| Talent Leave smoke regression | 1 | TC-07 |
| Tab stub render + zero network call | 3 | TC-08–TC-10 |
| Tab switch no-reload | 1 | TC-11 |
| Invalid/edge ?tab= param | 3 | TC-12–TC-14 |
| Redirect legacy holiday-management (Lead/Member) | 2 | TC-15–TC-16 |
| Access control tambahan | 2 | TC-17–TC-18 |
| Browser nav / refresh edge case | 2 | TC-19–TC-20 |
| **Total** | **20** | |

## Batasan Eksekusi (wajib dipatuhi executor/tester)

- DILARANG modifikasi `useHolidayQueries.ts` atau file di `features/holiday-management/**` selama testing/repro. Temuan defect nyata → buat bug ticket, jangan patch langsung.
- Talent Leave check (TC-07) smoke-level saja — JANGAN expand ke regression suite penuh Talent Leave (leave CRUD, export Google Sheets, dll di luar scope).
