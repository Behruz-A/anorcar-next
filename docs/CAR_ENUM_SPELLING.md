# Canonical car enum spelling — 2026-10-10

User approved correcting both backend and frontend wire values:
- CarTransmission.AUTOMATIC = AUTOMATIC (formerly AVTOMATIC)
- CarLocation.DAEJEON = DAEJEON (formerly DAEJON)

Other enums and member roles remain. Existing DTO/schema patterns derive enum validation from the canonical backend enum, and frontend browse/detail/create/edit/admin/compare controls derive from the canonical frontend enum. Existing UI label Automatic remains correct. Added Daejeon EN/KR/RU labels. Frontend parseCarsInquiry converts the two old bookmark filter values and deduplicates them; it sends only canonical values. The backend rejects legacy enum input names.

Development data migration: backend scripts/migrate-car-enum-spelling.cjs dry-run found 13 affected car documents (13 transmission values and 2 locations, overlapping in the same records). --apply updated exactly those fields in 13 documents using guarded raw collection updates; timestamps/counters/other fields are untouched. Subsequent dry-run found zero legacy values. Backup: C:/Users/behru/AppData/Local/Temp/anorcar-car-enum-spelling-1791619130261.json. It contains IDs and the previous enum fields, without credentials. To roll back, restore only affected enum fields from the backup with guards matching their migrated values, then coordinate both app enum definitions. Keep the snapshot until the change is accepted. The migration defaults to read-only and is restricted to MONGO_DEV; no production deployment was performed.

Validation: frontend Yarn typecheck, migration/auth/compare/restoration checks and 91-page production build passed. Live GraphQL validation passed for 42 documents, three upload documents and enum parity. Backend API/batch typechecks and both builds passed. Focused CarInput/mileage suites passed all 35 tests, including canonical locations and rejection of both old spellings. Live read-only query verified all 15 active cars serialize, both canonical filters match actual inventory and both old enum inputs fail.

Focused browser script: scripts/qa-car-enum-spelling.cjs. Live enum check: scripts/check-car-enum-spelling.cjs. Desktop preview: docs/screenshots/car-enum-corrected-filters.png. Frontend enum fixtures were updated; previous Agents work and unrelated changes were preserved. No dependency/lockfile changes or Git commit.

Final browser validation passed: desktop Automatic/Daejeon labels, combined filter serialization, two matching real listings, old bookmark normalization, KR/RU mobile labels and no runtime exceptions. Desktop screenshot was visually reviewed. The development server required a clean Yarn restart after repeated 404s; its previous .next-dev cache was retained at C:/Users/behru/AppData/Local/Temp/anorcar-enum-dev-cache-d2e1530c-5654-42aa-95f7-46874761c583. Final requests returned HTTP 200 and the updated dictionaries rendered correctly. Dev remains on port 3000; backend is on 3007.
