# FAQ to admin inquiries — 2026-10-12

The `/cs` contact form now submits directly to the backend through Apollo. The email-draft dialog has been replaced with **Send message**. A logged-in user can submit name, email, subject and message. Success appears only after the backend returns the saved inquiry ID; failures preserve the entered fields. An immediate submission lock prevents repeated clicks while a request is pending. Successful submissions clear the form and controlled subject selection. Guests receive a login link and keep their message.

## Architecture and contract

The sibling Nest API follows the existing NESTAR resolver/service/module and DI pattern. Added `components/inquiry`, `libs/dto/inquiry`, `libs/enums/inquiry.enum.ts` and `schemas/Inquiry.model.ts`; registered InquiryModule in ComponentsModule. MongoDB stores timestamped records in `inquiries`, indexed by newest date and status. Existing collections and shared modules remain unchanged.

- `createInquiry(input: InquiryInput!)`: existing AuthGuard; memberId comes from AuthMember, never from the client. Explicit field allowlist and NEW initial status.
- `getAllInquiriesByAdmin(input: AllInquiriesInquiry!)`: ADMIN RolesGuard; newest-first pagination, optional status and literal text search. Returns the established `list` / `metaCounter` shape. Page size is bounded to 60.
- `updateInquiryByAdmin(input: InquiryUpdate!)`: ADMIN RolesGuard; changes only NEW / READ / CLOSED status. No delete or reply operation.

DTO validation enforces name/email/message limits, email syntax, non-whitespace text, supported enums, Mongo IDs and bounded pagination. InquiryInput does not expose memberId or status. Mongoose validates schema enums/limits too. Client text is rendered as React text, with line breaks preserved in the admin detail dialog.

Frontend reuses the existing Apollo documents, typed enums/models, Inquiry component, InquiryList component and withAdminLayout. Added the missing **CS → 1:1 Inquiry** menu entry for `/_admin/cs/inquiry`. Admin can view full sender/message/date, search, filter, paginate, refresh, mark as read, close and reopen. Loading, empty, error and Retry states use existing MUI controls. Pagination returns to a valid page if status changes reduce the result count. EN/KR/RU strings are included.

No Telegram, email delivery, notification/socket events, external service, dependency, credential, data migration, commit or deployment was added. The hero, navbar, footer, topics, FAQs, news and map remain intact. Responses to buyers are not part of this receiving-only implementation.

## Verification

- Frontend Yarn typecheck and production build (91 pages); backend API/batch typechecks and Nest build passed. Build retains existing lint warnings.
- Nine isolated backend GraphQL tests exercise actual resolver/service, guards, JWT verification, ValidationPipe and Mongoose schema with an in-memory storage adapter: guest/user permissions, invalid/spoofed input, authenticated ownership, literal search, pagination, status updates, missing record and storage failure. No development database mutations.
- Live schema check validated 45 frontend operations, three inline uploads and registered enums against `localhost:3007/graphql`.
- `scripts/qa-cs.cjs`: existing FAQ/hero/news/map behavior at 320/390/768/1024/1440, neutral input styles, keyboard focus, form validation, guest login prompt, EN/KR/RU and news Retry.
- `scripts/qa-inquiries.cjs`: buyer success/failure/retry, duplicate submission lock, correct enum/payload and successful form reset at 1440/390; admin list/detail/pagination/status/reopen/filter/search/empty/error/Retry. Mutation responses and authentication are browser fixtures; no real messages or database writes. No runtime exceptions.

Previews: `docs/screenshots/cs-inquiry-sent-1440.png`, `cs-inquiry-sent-390.png`, `admin-inquiries-1440.png`, `admin-inquiry-detail-1440.png`.

Backend handoff files are in sibling `anorcar/docs`; its documented `docs/ai` directory is absent.
