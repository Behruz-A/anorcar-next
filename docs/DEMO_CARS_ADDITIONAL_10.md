# Ten additional demo car listings

Added on 2026-10-08 through normal createCar, getCar and likeTargetCar GraphQL operations. Reused existing demo AGENT and two demo USER accounts; no new accounts or backend/frontend source changes.

Inventory: 5 ACTIVE before, 15 ACTIVE after. Exactly ten new listings. Owner memberCars: 14. Every new listing has one like and two unique authenticated views, qualifying for current Trending thresholds. Existing records and engagement left untouched.

Prices are USD. Exact backend enums retained, including AVTOMATIC, CHONJU and DAEJON. All records explicitly describe themselves as fictional development demos. Images reuse existing illustrative Budget assets; they are not photographs of these exact models. No mileage or unsupported fields.

| Listing | ID | USD | Image |
| --- | --- | ---: | --- |
| Demo Hyundai i10 2020 | 6ac758d0e8ca66a84a68305e | 8500 | /img/car/budget/budget-blue.png |
| Demo Hyundai i20 2021 | 6ac758d1e8ca66a84a683077 | 12500 | /img/car/budget/budget-red.png |
| Demo Hyundai Accent 2022 | 6ac758d2e8ca66a84a683090 | 15500 | /img/car/budget/budget-white.png |
| Demo Hyundai Avante 2023 | 6ac758d3e8ca66a84a6830a9 | 19900 | /img/car/budget/budget-silver.png |
| Demo Hyundai Kona 2024 | 6ac758d5e8ca66a84a6830c2 | 26900 | /img/car/budget/budget-orange.png |
| Demo Hyundai Ioniq 5 2024 | 6ac758d6e8ca66a84a6830db | 42500 | /img/car/budget/budget-slate.png |
| Demo Hyundai Sonata Hybrid 2023 | 6ac758d7e8ca66a84a6830f4 | 29900 | /img/car/budget/budget-red.png |
| Demo Hyundai Tucson Diesel 2022 | 6ac758d8e8ca66a84a68310d | 25900 | /img/car/budget/budget-slate.png |
| Demo Hyundai Santa Fe Hybrid 2024 | 6ac758d9e8ca66a84a683126 | 38900 | /img/car/budget/budget-green.png |
| Demo Hyundai Palisade 2024 | 6ac758e4e8ca66a84a68313f | 46500 | /img/car/budget/budget-white.png |

Validation: all ten IDs present and ACTIVE, exactly +10 total, valid asset paths, each >=1 like and >=2 views. Yarn typecheck and live GraphQL (42 operations, three inline uploads and enums) passed. Actual browser verified Recently Added eight listings in createdAt DESC/API ID order, 4/2/1 responsive columns, images, CTA inquiry/navigation, locales and 390/320 mobile without overflow or runtime exceptions. Other live section counts: Trending 8, Popular 7, Top 8. Existing display limits preserved.

No commit/deployment or credentials included. Development server remains at localhost:3000.
