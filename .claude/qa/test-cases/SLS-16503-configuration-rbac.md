# Test Case — QA-3 (SLS-16503): Configuration Menu Navigation Grouping — Security/RBAC

**Feature**: Configuration Menu Navigation Grouping (Phase 1 MVP)
**Focus**: Member role harus TIDAK BISA sampai ke `/dashboard/configuration` lewat jalur apapun.
**Scope**: sidebar visibility, direct URL, browser back/forward, redirect chain dari `/dashboard/holiday-management`, API surface review.
**Out of scope**: tidak ada perubahan production code (test-only ticket). Defect ditemukan → lapor via bug ticket terpisah, link balik ke SLS-16503.

## Referensi kode (read-only, untuk acuan expected behavior)

- Role gate component: `apps/tere-project/src/components/RoleBasedRoute.tsx` — default `redirectTo` = `/dashboard/reports`, BUKAN `/dashboard`.
- Sidebar menu config: `apps/tere-project/src/components/sidebar.tsx` (`menuItems` array, filter by `member.isLead`).
- Redirect lama: `apps/tere-project/src/app/dashboard/holiday-management/page.tsx` → `redirect('/dashboard/configuration?tab=holiday')`.
- Config tabs: `apps/tere-project/src/shared/constants/configuration-tabs.ts`, `apps/tere-project/src/features/configuration/components/ConfigurationTabs.tsx`.
- API route reused: `apps/tere-project/src/app/api/holidays/*` (existing, no new route expected).
- Role check pattern server-side: `apps/tere-project/src/server/auth/with-role.ts`.

## AMBIGUITAS DITEMUKAN (lapor ke user/PM sebelum sign-off)

1. **Redirect target: CONFIRMED `/dashboard`.** `apps/tere-project/src/app/dashboard/configuration/page.tsx:40` pakai `RoleBasedRoute` dengan override eksplisit `redirectTo="/dashboard"` — bukan default component (`/dashboard/reports`). Target akhir definitif `/dashboard`, sesuai AC. Test case di bawah menguji ini sebagai fakta, bukan asumsi.
2. **Client-side only guard = race condition window.** `RoleBasedRoute` melakukan redirect via `useEffect` (client-side, setelah render pertama) dan hanya `return null` saat role belum sesuai — artinya ada window singkat di mana `isLoading` selesai tapi redirect belum jalan. Ditambahkan TC untuk verifikasi tidak ada flash of content (config data/UI) selama window ini, dan tidak ada API call config yang sempat fire dari client sebelum redirect.
3. **AC tidak menyebut soal server-side protection** (misal middleware / server component check) untuk `/dashboard/configuration` — hanya client component guard yang saya temukan (`RoleBasedRoute` adalah `'use client'`). Kalau tidak ada guard server-side, page shell (HTML skeleton) bisa saja ter-render sebelum JS redirect jalan (khususnya SSR/RSC). Ditambahkan TC-08 untuk cek initial server response (curl / no-JS) tidak leak konten configuration.
4. **Definisi "config endpoint baru"**: task bilang reuse `/api/holidays` saja, tapi `ConfigurationTabs.tsx` sudah punya tab `wp-weight`, `target-wp`, `audit-log` (masih `ComingSoon` placeholder). Diasumsikan Phase 1 MVP tab-tab ini belum manggil endpoint apapun (murni UI placeholder) — TC-10 verifikasi asumsi ini, tandai sebagai bug kalau ternyata ada fetch tersembunyi.

---

## Precondition Umum

- Ada 2 akun test: `member@test.com` (role Member, `isLead=false`) dan `lead@test.com` (role Lead, `isLead=true`), sudah terverifikasi via `useMemberProfile()`.
- Browser bersih (no cache/session lama), atau gunakan incognito per test run.
- Environment: staging/dev yang sudah punya build fitur ini (page `dashboard/configuration` ter-deploy).

---

## TC-01 — Sidebar: menu Configuration tidak visible untuk Member

**Given** user login sebagai Member (`isLead: false`)
**When** user melihat sidebar navigasi di `/dashboard`
**Then**
- Item menu "Configuration" TIDAK muncul di `filteredMenuItems` sidebar.
- Tidak ada DOM element (button/link) dengan label "Configuration" ter-render di sidebar, baik desktop maupun mobile drawer.

**Steps**:
1. Login sebagai Member.
2. Buka `/dashboard`.
3. Inspect sidebar (desktop width ≥1024px).
4. Resize ke mobile width (<1024px), buka drawer (hamburger).
5. Cek DOM/inspect element, cari text "Configuration".

**Expected**: Item Configuration tidak ada di kedua breakpoint. Tidak cukup hanya "disabled/greyed out" — harus benar-benar tidak di-render (bukan cuma `display:none` via CSS, karena itu masih bisa di-inspect & diklik via devtools/force-click).

---

## TC-02 — Direct URL: Member ketik `/dashboard/configuration` di address bar

**Given** user login sebagai Member, session valid
**When** user mengetik langsung `https://<host>/dashboard/configuration` di address bar dan Enter
**Then** user diarahkan menjauh dari halaman configuration (redirect terjadi)

**Steps**:
1. Login sebagai Member.
2. Ketik URL `/dashboard/configuration` langsung di address bar.
3. Tunggu page load selesai (termasu `isLoading` dari `useMemberProfile` resolve).
4. Cek URL akhir di address bar.
5. Cek konten yang di-render (HolidayCalendar/BulkInsert/tab configuration) TIDAK muncul sama sekali, bahkan sekilas.

**Expected**: URL akhir = `/dashboard` (definitif, sesuai override eksplisit di `configuration/page.tsx:40`). Deviasi apa pun dari `/dashboard` adalah defect. Tidak ada flash of configuration content sebelum redirect.

---

## TC-03 — Direct URL: Member akses configuration dengan query tab spesifik (`?tab=wp-weight`, `?tab=audit-log`)

**Given** user login sebagai Member
**When** user akses `/dashboard/configuration?tab=holiday`, `?tab=wp-weight`, `?tab=target-wp`, `?tab=audit-log` satu per satu
**Then** semua varian tab tetap redirect keluar, tidak ada satupun tab yang bocor ke Member

**Steps**: sama seperti TC-02, ulangi untuk tiap query param tab.

**Expected**: Semua 4 varian redirect konsisten, tidak ada yang somehow lolos karena query param tidak dikenali oleh guard.

---

## TC-04 — Browser back/forward setelah redirect

**Given** user login sebagai Member, sudah pernah mengalami redirect dari `/dashboard/configuration` ke `/dashboard` (state di TC-02)
**When** user tekan tombol Back browser, lalu tekan Forward
**Then** URL akhir setelah Back = `/dashboard`, URL akhir setelah Forward = `/dashboard` — user tidak pernah mendarat/melihat konten `/dashboard/configuration` di kedua arah navigasi

**Steps**:
1. Lanjutan dari TC-02 (user sudah di-redirect ke `/dashboard`).
2. Klik tombol Back browser.
3. Amati URL & konten yang muncul (sesaat maupun final).
4. Klik tombol Forward.
5. Amati URL & konten lagi.

**Expected**:
- Back: browser history entry untuk `/dashboard/configuration` — jika ada — harus langsung ke-redirect ulang (karena guard re-evaluate saat mount), TIDAK menampilkan konten configuration walau hanya untuk beberapa frame. URL akhir = `/dashboard` (definitif).
- Forward: sama, tidak pernah stay di `/dashboard/configuration`. URL akhir = `/dashboard` (definitif).
- Ulangi test 2x (double-back, double-forward) untuk pastikan tidak ada history loop yang somehow escape guard, dan URL akhir tetap konsisten `/dashboard`.

---

## TC-05 — Redirect chain dari route lama `/dashboard/holiday-management`

**Given** user login sebagai Member
**When** user akses `/dashboard/holiday-management` (route lama, sudah redirect ke `/dashboard/configuration?tab=holiday` di server-side sesuai kode `redirect()` di `holiday-management/page.tsx`)
**Then** chained redirect berakhir di `/dashboard` (bukan berhenti di configuration), dan konten configuration TIDAK pernah ter-expose di step antara

**Steps**:
1. Login sebagai Member.
2. Akses `/dashboard/holiday-management` langsung.
3. Amati network tab: harus ada 2 redirect berantai — (a) server redirect `holiday-management` → `configuration?tab=holiday`, (b) client guard redirect `configuration` → final destination.
4. Cek URL akhir & konten akhir.
5. Screenshot/record video jika perlu untuk cek flash of content di step (a)→(b), karena step (a) adalah server redirect (cepat) tapi step (b) client-side (butuh JS load + `useMemberProfile` resolve) — ada window Server-Rendered Configuration shell sempat muncul sebelum JS redirect jalan.

**Expected**: Final URL bukan `/dashboard/configuration` ataupun `/dashboard/holiday-management`. Tidak ada konten holiday/config yang ter-render, termasuk saat window antara server-redirect selesai dan client-guard belum jalan (lihat Ambiguitas #2 dan #3 — kalau ternyata ADA flash, ini bug, laporkan sebagai defect terpisah karena butuh server-side guard, bukan cuma client).

---

## TC-06 — Lead tetap bisa akses semua jalur di atas (regression / sanity)

**Given** user login sebagai Lead (`isLead: true`)
**When** ulangi TC-01 s.d. TC-05 dengan akun Lead
**Then** Lead bisa lihat menu Configuration di sidebar, bisa direct URL, back/forward normal, dan redirect chain dari holiday-management berakhir DI `/dashboard/configuration?tab=holiday` dengan konten holiday ter-render

**Steps**: mirror TC-01–05, akun Lead.

**Expected**: Semua flow normal untuk Lead — dipakai sebagai kontrol negatif, memastikan restriksi di TC-01–05 memang role-specific, bukan config yang broken untuk semua orang.

---

## TC-07 — Unauthenticated user (belum login / session expired) akses `/dashboard/configuration`

**Given** user belum login / session/token invalid
**When** akses `/dashboard/configuration` langsung
**Then** diarahkan ke halaman login, bukan ke `/dashboard` atau tampil konten configuration

**Steps**:
1. Clear session/cookie/token.
2. Akses `/dashboard/configuration` langsung.
3. Cek redirect ke halaman auth/login.

**Expected**: Standard auth redirect berlaku (mengikuti pola auth guard existing di project, bukan role guard). Tidak boleh sampai render configuration shell duluan sebelum auth check.

---

## TC-08 — No-JS / raw server response tidak leak konten configuration untuk Member

**Given** user login sebagai Member, valid session/cookie
**When** request `GET /dashboard/configuration` langsung via `curl` dengan cookie session Member (tanpa eksekusi JS)
**Then** response HTML tidak mengandung konten sensitif configuration (holiday list/data, WP weight config, dsb) — baik itu di-redirect via HTTP 3xx atau di render sebagai shell kosong yang baru di-hide oleh JS

**Steps**:
1. Login via browser, ambil session cookie Member.
2. `curl -I` dan `curl` biasa ke `/dashboard/configuration` pakai cookie tsb.
3. Inspect response: status code, `Location` header (jika redirect), dan body HTML jika 200.

**Expected**: Idealnya server-side redirect (3xx) atau minimal HTML body tidak mengandung data configuration actual (karena `RoleBasedRoute` client-side guard berarti kemungkinan besar server tetap kirim 200 + shell HTML kosong, baru di-redirect oleh JS). Kalau body ternyata berisi markup/data configuration (misal SSR data leak lewat RSC payload), catat sebagai defect Critical — ini bypass client-only guard.

---

## TC-09 — API surface review: tidak ada config endpoint baru unauthenticated

**Given** codebase & network traffic saat Configuration page dibuka oleh Lead (baseline) dan dicoba diakses Member
**When** review route handlers di `apps/tere-project/src/app/api/` + network tab saat load configuration page
**Then** hanya `GET/POST /api/holidays`, `GET/PUT/DELETE /api/holidays/[id]`, `POST /api/holidays/bulk` yang terpanggil (existing, reused) — tidak ada endpoint baru seperti `/api/configuration`, `/api/wp-weight-config` (aktif dipanggil), dsb yang expose data tanpa role check

**Steps**:
1. Grep `apps/tere-project/src/app/api/` untuk direktori baru yang berhubungan dengan configuration (selain holidays yang sudah ada).
2. Buka Configuration page sebagai Lead, capture semua network request (tab holiday, wp-weight, target-wp, audit-log).
3. Buka Configuration page sebagai Member (paksa akses / force navigate sebelum redirect selesai jika bisa), capture network request yang sempat fire sebelum redirect.
4. Untuk tiap endpoint yang ketemu di step 2/3, cek ada role/auth guard (`withRole`/`withAuth`) di server module-nya.

**Expected**:
- Tidak ada route baru di luar `/api/holidays/*` yang aktif dipanggil dari Configuration page (Phase 1 MVP).
- Tidak ada request config yang sempat fire dari sisi Member sebelum redirect selesai (lihat Ambiguitas #2 — race condition window).
- Semua endpoint holidays yang dipanggil tetap punya auth check yang sama seperti sebelum fitur ini ada (kontrak tidak berubah — bandingkan request/response shape dengan behavior existing holiday-management page).

---

## TC-10 — Placeholder tab (`wp-weight`, `target-wp`, `audit-log`) tidak fetch data apapun

**Given** user Lead membuka Configuration page
**When** klik tab "WP Weight Config", "Target WP Config", "Audit Log" (semua masih `ComingSoon` placeholder per kode saat ini)
**Then** tidak ada network request yang fire saat tab-tab ini diklik/aktif

**Steps**:
1. Login Lead, buka `/dashboard/configuration`.
2. Buka Network tab devtools, clear log.
3. Klik tab wp-weight, lalu target-wp, lalu audit-log satu-satu.
4. Cek network log tiap kali klik.

**Expected**: Tidak ada request baru ter-fire (karena masih placeholder `ComingSoon`). Jika ternyata ada fetch tersembunyi (misal prefetch data yang belum dipakai), catat sebagai defect/observation — berpotensi expose data config lewat endpoint belum ter-guard walau UI-nya belum jadi.

---

## Ringkasan

| # | Area | Fokus |
|---|------|-------|
| TC-01 | Sidebar visibility | Menu tidak render untuk Member |
| TC-02 | Direct URL | Redirect saat direct navigate |
| TC-03 | Direct URL + query tab | Semua tab varian ke-block |
| TC-04 | Back/forward | Tidak bisa "curi" akses via history nav |
| TC-05 | Redirect chain | holiday-management → configuration → final, no leak di step antara |
| TC-06 | Regression (Lead) | Kontrol negatif — Lead tetap normal |
| TC-07 | Unauthenticated | Auth guard duluan sebelum role guard |
| TC-08 | Server response | No-JS / raw HTML tidak leak |
| TC-09 | API surface | Tidak ada endpoint config baru unauthenticated |
| TC-10 | Placeholder tabs | Tidak ada fetch tersembunyi di tab belum jadi |

**Total: 10 test case** (TC-01 s.d. TC-10, TC-06 sebagai regression control, sisanya negative/security-focused sesuai scope task).
