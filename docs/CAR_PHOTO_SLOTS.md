# Car photo slots — 2026-10-13

The existing add/edit car form now displays five compact photo slots. Uploaded thumbnails replace empty slots; after one photo, four visible “Add photo” buttons remain. Each opens the existing multiple-file picker. Thumbnails have a labeled remove button, and removing a photo restores an empty slot. The section displays the current count out of five.

Slots are at most 112px wide and 90px high and wrap on narrow screens. Keyboard focus, translated button labels and upload/submit disabled states are included. At five photos no add slot remains and the file input is disabled.

Preserved existing JPEG/PNG validation, five-photo limit, compression, authenticated multipart GraphQL upload, create/update mutations and error handling. The upload input is hidden behind the visible buttons. No dependencies or backend changes.

Verification: Yarn typecheck and isolated Chrome upload fixtures exercise file chooser access, one photo plus four empty slots, filling all five slots, removal, overflow rejection and failed upload/retry on desktop/mobile. No actual uploads or listings are saved during QA. Script: `scripts/qa-car-photos.cjs`; previews: `docs/screenshots/car-photos-one-1440.png`, `car-photos-one-390.png` and matching full-slot screenshots.
