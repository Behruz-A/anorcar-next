# Write Article UI - 2026-10-10

## Result

Refined My Page > Write Article using the existing Pages Router/layout HOC, MyMenu, WriteArticle, Teditor, MUI and SCSS. Navbar, footer, account hero, category routes and backend contracts remain unchanged. The account container/sidebar remains 1300px/250px with a 24px gap; the shared heading now displays the article-specific title/subtitle only in this category.

- White editor card with localized heading/icon, title, existing FREE/RECOMMEND/NEWS/HUMOR categories, optional cover and rich content in that order. Replaced the mobile placeholder with the same functional form; account navigation still collapses on mobile.
- Preserved Toast UI, Markdown/WYSIWYG and heading/bold/italic/strike/link/image/table/list/checklist commands. Styled toolbar icons/tooltips/active states and exposed the original overflow commands as wrapping rows on narrow screens. Comfortable editor padding, 15px text and 380px minimum writing area.
- Added a branded, accessible MUI image dialog with Upload File/Image URL tabs, optional alt text, Cancel/Insert and pending/error states. HTTP/HTTPS URL validation. Inline paste/drop image hooks still use the existing multipart imageUploader(target: article).
- Optional cover uses the existing articleImage field and uploader: wide preview, change/remove and backend-compatible JPG/JPEG/PNG and 15,000,000-byte limit. Preserved the old uploaded-inline-image thumbnail fallback until a cover is explicitly chosen or removed.
- Publish Article/Cancel, field-level blur feedback, required/length checks, actual backend errors through existing SweetAlert feedback, publishing/upload states and duplicate submission guard. Failed publish preserves input. Cancel confirms discarding a nonempty article, then uses the existing My Articles category route. No drafts/autosave feature added.
- Fixed the installed React Toast UI wrapper's missing unmount cleanup: an in-file subclass destroys the existing editor and clears its host, preventing Strict Mode from turning editor chrome into article content. Locale remounts retain current Markdown content. Publishing makes the editor inert; pending uploads abort when the component unmounts.
- EN/KR/RU labels added to the existing common dictionaries. No fake data in the application.

## Backend constraints preserved

Read the real BoardArticleInput at anorcar/apps/anorcar-api/src/libs/dto/board-article/board-article.input.ts before changes. Title is 3-50 characters; articleContent is 3-250 characters **including HTML formatting**. This limits long posts and larger formatted content; the UI shows the count and validation rather than truncating content or changing backend rules. articleImage is optional. No backend source/schema/data changes.

## Validation

- Yarn typecheck passed after phases and final editor changes.
- Yarn production build passed: 91 localized pages, existing lint warnings and no errors.
- Yarn check:graphql validated 42 operations, three upload documents and registered enums against localhost:3007/graphql (read-only).
- scripts/qa-write-article.cjs passed in isolated Chrome at 1440/1024/768/390/320px: bounds, initial blank editor, disabled publish, active menu, real mouse/keyboard writing, title blur validation, category selection, Markdown/WYSIWYG round trip, image dialog bounds, MIME/size rejection, cover upload error/success/removal, URL validation/insertion/alt text, inline file error/success, old thumbnail fallback, publishing error/success/loading/duplicate guard, exact existing four-field GraphQL input, discard confirmation, localized EN/KR/RU and Agent listing links. No uncaught runtime exceptions.
- Authenticated GraphQL/upload replies were intercepted browser fixtures. No real account/article mutation, upload or demo seed was performed.
- Desktop/mobile form and image-dialog fixture screenshots were visually reviewed in docs/screenshots. Dev remains on port 3000 after refreshing locale dictionaries. No dependency, lockfile, commit or deployment changes.
