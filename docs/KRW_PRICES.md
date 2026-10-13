# KRW price presentation — 2026-10-13

The user requested replacing USD with Korean won and explicitly chose to preserve numeric values: `$20,000` becomes `₩20,000`. This supersedes earlier USD presentation decisions. No exchange rate, calculation, MongoDB migration or backend changes are involved. Existing stored amounts, filter thresholds, sorting, GraphQL inputs and saved URLs remain unchanged.

`libs/currency.ts` centralizes KRW formatting with the won symbol, separators and zero fractional digits. It normalizes the existing `kr` language key to `ko-KR` and handles missing/nonfinite values as a dash. Zero displays as `₩0`. `libs/carCompare.ts` delegates to this formatter.

Updated homepage cards (popular/top/recent/trending), budget shortcuts and Model Search, Cars grid/list cards and filters, detail prices, shared similar-car cards, My Page cards, add/edit-car price label, admin car price cells and comparison cards/table/picker. EN/KR/RU budget labels and range/input labels now use won/KRW. Budget numeric thresholds remain the same by user instruction.

Updated comparison restoration assertions and the browser browse suite's currency assertion. Existing historical USD reports/demo seed documentation retain their original historical units; this report describes the current display decision.

Validation: Yarn comparison and migration tests passed; phase/final TypeScript and production-build results are recorded below. Search confirms no USD/dollar price labels or formatting remain in active frontend code and translations. No automatic commit/deployment.

Final results: `yarn.cmd typecheck`, `yarn.cmd test:compare`, `yarn.cmd test:migration` and `yarn.cmd build` passed. Production build generated 91 pages, with existing lint/Browserslist warnings. Comparison fixtures verify EN/KR/RU won formatting, zero values and unchanged numeric prices. Browser currency assertion was updated, but the live browser suite was not rerun in this change.
