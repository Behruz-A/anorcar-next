# Agent car catalog import - 2026-10-14

Created 73 additional sample listings through the existing authenticated GraphQL login, imagesUploader and createCar operations. No direct MongoDB writes, application code changes, schema migrations or changes to the Nestar-derived architecture.

The user explicitly requested these counts and later excluded Martin and Jhon. Khan's existing two listings are preserved. Other listings, including the 14 existing orphaned demo cars, are unchanged.

| Agent | Added | NEW | USED | Total active |
| --- | ---: | ---: | ---: | ---: |
| Khan | 15 | 4 | 11 | 17 |
| Kevin | 12 | 3 | 9 | 12 |
| Angel | 13 | 2 | 11 | 13 |
| Nathan | 14 | 3 | 11 | 14 |
| Leo | 10 | 3 | 7 | 10 |
| Adam | 9 | 3 | 6 | 9 |

## Photos and listing data

73 distinct genuine photographs were visually reviewed. Seven brands, 25 model/variant names. All saved photos are 1920 pixels wide and at least 812 pixels high. No AI-generated images. Full-car exterior photographs were preferred over damaged cars, components, interiors, unrelated models, ambiguous photo-date/model-year images and less suitable primary angles.

Files are stored at `C:/Users/behru/Desktop/CARIMG/ANORCAR-2026-10-14`. Existing authenticated uploads store the actual listing files under the backend's `uploads/car` directory. Additional catalog brands were resolved by the existing brandName service; their existing generic logo remains.

Each car description explicitly identifies a sample listing: price, mileage, condition and location are illustrative rather than verified dealer stock. Color and model are matched to the selected photograph. KRW prices use plausible sample amounts. NEW examples have zero sample mileage; USED examples have varied nonzero mileage. Gasoline, diesel, hybrid and electric inputs follow the selected model/variant. The listing description and JSON manifest retain photographer, source and license attribution. Image pixels were not edited locally; the source-provided Wikimedia preview is resized.

Photos remain available under their individual CC0/CC BY/CC BY-SA licenses. The manifest records full original file URLs, photographer names, license URLs, original/saved dimensions and SHA-256 hashes. This does not license the application itself under an image license.

## Validation

- 73 unique created IDs; exact added counts verified per authenticated owner.
- 73/73 public cars have matching owner/agent, brand, price, condition and image references.
- 73/73 backend image responses are valid nonempty JPEG files.
- Public query returns 76 joined listings; total counter is 90 because the existing 14 orphaned demo cars are still counted before joins. No orphan cleanup was performed.
- Recently Added Cars returns eight imported listings. Isolated headless Chrome verified eight actual photos, KRW values and no horizontal overflow at 1440px and 390px. Cars page verified nine loaded cards/photos.
- `yarn.cmd typecheck`: passed. No build is required for this data-only import.
- No fake likes, views, rank or engagement records were added. Trending still requires genuine engagement and remains affected by the previously diagnosed orphan-before-pagination issue.
- Import login sessions were logged out after each agent. Passwords, tokens and refresh cookies were not stored in the report, manifest or import ledger.

## Imported records and photo credits

| Agent | Listing | ID | Photograph | License |
| --- | --- | --- | --- | --- |
| Khan | Genesis GV70 2025 | `6aced09ec98aa26ea0c34a84` | [Matti Blume](https://commons.wikimedia.org/?curid=177801138) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.en) |
| Kevin | Hyundai IONIQ 5 2026 | `6aced0a3c98aa26ea0c34ad9` | [Cutlass](https://commons.wikimedia.org/?curid=195366065) | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) |
| Khan | Kia Sportage 2025 | `6aced09ec98aa26ea0c34a8a` | [LuvsMG481](https://commons.wikimedia.org/?curid=184291709) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Nathan | Tesla Model Y 2025 | `6aced0abc98aa26ea0c34b66` | [Ethan Llamas](https://commons.wikimedia.org/?curid=155792495) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Leo | Genesis GV80 2025 | `6aced0afc98aa26ea0c34bb3` | [MercurySable99](https://commons.wikimedia.org/?curid=167773851) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Adam | Hyundai IONIQ 5 N 2024 | `6aced0b2c98aa26ea0c34bec` | [Ethan Llamas](https://commons.wikimedia.org/?curid=149431300) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Khan | BMW X3 2022 | `6aced09ec98aa26ea0c34a90` | [Kevauto](https://commons.wikimedia.org/?curid=120088821) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Kevin | Genesis G70 2023 | `6aced0a3c98aa26ea0c34ade` | [Elise240SX](https://commons.wikimedia.org/?curid=145529149) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Angel | Hyundai IONIQ 5 2023 | `6aced0a6c98aa26ea0c34b1e` | [Kevauto](https://commons.wikimedia.org/?curid=135061773) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Nathan | Kia K5 2022 | `6aced0abc98aa26ea0c34b6b` | [Elise240SX](https://commons.wikimedia.org/?curid=122713143) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Leo | Mercedes-Benz GLC 2023 | `6aced0b0c98aa26ea0c34bb8` | [LuvsMG481](https://commons.wikimedia.org/?curid=188340594) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Adam | Tesla Model Y 2025 | `6aced0b2c98aa26ea0c34bf1` | [Ethan Llamas](https://commons.wikimedia.org/?curid=155792492) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Khan | Genesis G70 2023 | `6aced09fc98aa26ea0c34a95` | [Elise240SX](https://commons.wikimedia.org/?curid=131462242) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Kevin | Hyundai IONIQ 6 2023 | `6aced0a3c98aa26ea0c34ae3` | [Elise240SX](https://commons.wikimedia.org/?curid=131462240) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Angel | Kia K5 2021 | `6aced0a6c98aa26ea0c34b23` | [MercurySable99](https://commons.wikimedia.org/?curid=137324188) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Nathan | Mercedes-Benz GLC 2023 | `6aced0acc98aa26ea0c34b70` | [Kevauto](https://commons.wikimedia.org/?curid=145874625) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Leo | Audi Q5 2022 | `6aced0b0c98aa26ea0c34bbd` | [Mr.choppers](https://commons.wikimedia.org/?curid=137710690) | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Adam | BMW X3 2018 | `6aced0b3c98aa26ea0c34bf6` | [Kevauto](https://commons.wikimedia.org/?curid=70355489) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Khan | Hyundai IONIQ 5 2022 | `6aced09fc98aa26ea0c34a9a` | [Mr.choppers](https://commons.wikimedia.org/?curid=133426179) | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Kevin | Kia K5 2021 | `6aced0a3c98aa26ea0c34ae8` | [MercurySable99](https://commons.wikimedia.org/?curid=137331691) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Angel | Mercedes-Benz GLC 2019 | `6aced0a7c98aa26ea0c34b28` | [Elise240SX](https://commons.wikimedia.org/?curid=155184472) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Nathan | BMW X3 2018 | `6aced0acc98aa26ea0c34b75` | [Kevauto](https://commons.wikimedia.org/?curid=68450946) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Leo | Hyundai IONIQ 6 2023 | `6aced0b0c98aa26ea0c34bc2` | [Kevauto](https://commons.wikimedia.org/?curid=132489652) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Adam | Genesis G70 2022 | `6aced0b3c98aa26ea0c34bfb` | [Elise240SX](https://commons.wikimedia.org/?curid=164366004) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Khan | Genesis GV80 2024 | `6aced09fc98aa26ea0c34a9f` | [Elise240SX](https://commons.wikimedia.org/?curid=153654875) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Kevin | Tesla Model Y 2024 | `6aced0a4c98aa26ea0c34aee` | [Ethan Llamas](https://commons.wikimedia.org/?curid=150915552) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Angel | Hyundai Santa Fe 2024 | `6aced0a8c98aa26ea0c34b2d` | [Mr.choppers](https://commons.wikimedia.org/?curid=147249434) | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Nathan | Kia Sorento 2024 | `6aced0acc98aa26ea0c34b7a` | [Deathpallie325](https://commons.wikimedia.org/?curid=148722093) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Leo | Hyundai Palisade 2026 | `6aced0b0c98aa26ea0c34bc7` | [Kevauto](https://commons.wikimedia.org/?curid=169268690) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Adam | Kia EV9 2025 | `6aced0b3c98aa26ea0c34c00` | [Matti Blume](https://commons.wikimedia.org/?curid=177844773) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.en) |
| Khan | Mercedes-Benz GLC 2018 | `6aced0a0c98aa26ea0c34aa5` | [Vauxford](https://commons.wikimedia.org/?curid=67350801) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Kevin | BMW X5 2020 | `6aced0a4c98aa26ea0c34af3` | [Mr.choppers](https://commons.wikimedia.org/?curid=95200630) | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Angel | Genesis G70 2022 | `6aced0a9c98aa26ea0c34b32` | [MercurySable99](https://commons.wikimedia.org/?curid=137324196) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Nathan | Hyundai Tucson 2023 | `6aced0adc98aa26ea0c34b7f` | [Dairokkan9](https://commons.wikimedia.org/?curid=131143326) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Leo | Genesis G80 2023 | `6aced0b1c98aa26ea0c34bcc` | [Elise240SX](https://commons.wikimedia.org/?curid=136501951) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Adam | Audi Q5 2021 | `6aced0b4c98aa26ea0c34c05` | [Vauxford](https://commons.wikimedia.org/?curid=110437331) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Khan | BMW X5 2020 | `6aced0a0c98aa26ea0c34aaa` | [Ethan Llamas](https://commons.wikimedia.org/?curid=149841486) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Kevin | Kia Sportage 2023 | `6aced0a4c98aa26ea0c34af8` | [Elise240SX](https://commons.wikimedia.org/?curid=118367378) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Angel | Hyundai Palisade 2022 | `6aced0a9c98aa26ea0c34b37` | [Kevauto](https://commons.wikimedia.org/?curid=145874615) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Nathan | Kia Sportage 2018 | `6aced0adc98aa26ea0c34b84` | [User3204](https://commons.wikimedia.org/?curid=85340200) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Leo | Hyundai Santa Fe 2019 | `6aced0b1c98aa26ea0c34bd1` | [Kevauto](https://commons.wikimedia.org/?curid=76020051) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Adam | Kia K5 2021 | `6aced0b4c98aa26ea0c34c0a` | [SsmIntrigue](https://commons.wikimedia.org/?curid=102330825) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Khan | Kia Sorento 2021 | `6aced0a0c98aa26ea0c34aaf` | [Kevauto](https://commons.wikimedia.org/?curid=99004876) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Kevin | Audi Q5 2017 | `6aced0a5c98aa26ea0c34afe` | [Elise240SX](https://commons.wikimedia.org/?curid=112700101) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Angel | Genesis G80 2021 | `6aced0a9c98aa26ea0c34b3c` | [Mr.choppers](https://commons.wikimedia.org/?curid=99682411) | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Nathan | Hyundai Santa Fe 2018 | `6aced0adc98aa26ea0c34b89` | [Alexander Migl](https://commons.wikimedia.org/?curid=67190635) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Leo | Kia Sorento 2021 | `6aced0b1c98aa26ea0c34bd6` | [SsmIntrigue](https://commons.wikimedia.org/?curid=99105678) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Adam | BMW X5 2016 | `6aced0b4c98aa26ea0c34c0f` | [Kevauto](https://commons.wikimedia.org/?curid=67244095) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Khan | Hyundai Sonata 2024 | `6aced0a1c98aa26ea0c34ab4` | [MercurySable99](https://commons.wikimedia.org/?curid=151139011) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Kevin | Kia EV9 2025 | `6aced0a5c98aa26ea0c34b03` | [Elise240SX](https://commons.wikimedia.org/?curid=163767548) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Angel | Hyundai Kona 2024 | `6aced0a9c98aa26ea0c34b41` | [MercurySable99](https://commons.wikimedia.org/?curid=149046255) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Nathan | Kia EV9 2024 | `6aced0adc98aa26ea0c34b8e` | [Kevauto](https://commons.wikimedia.org/?curid=155224894) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Leo | Hyundai Kona 2024 | `6aced0b1c98aa26ea0c34bdb` | [MercurySable99](https://commons.wikimedia.org/?curid=148114039) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Adam | Hyundai Kona 2024 | `6aced0b4c98aa26ea0c34c14` | [Kevauto](https://commons.wikimedia.org/?curid=135060375) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Khan | Genesis G80 2021 | `6aced0a1c98aa26ea0c34ab9` | [Elise240SX](https://commons.wikimedia.org/?curid=131735461) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Kevin | Hyundai Palisade 2021 | `6aced0a5c98aa26ea0c34b08` | [EurovisionNim](https://commons.wikimedia.org/?curid=121288631) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Angel | Kia Sorento 2021 | `6aced0aac98aa26ea0c34b46` | [SsmIntrigue](https://commons.wikimedia.org/?curid=99105681) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Nathan | Genesis GV70 2023 | `6aced0aec98aa26ea0c34b93` | [Elise240SX](https://commons.wikimedia.org/?curid=122713106) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Leo | Hyundai Sonata 2020 | `6aced0b2c98aa26ea0c34be0` | [MercurySable99](https://commons.wikimedia.org/?curid=126449579) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Khan | Hyundai Palisade 2020 | `6aced0a1c98aa26ea0c34abe` | [Kevauto](https://commons.wikimedia.org/?curid=88079034) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Kevin | Kia Carnival 2023 | `6aced0a5c98aa26ea0c34b0d` | [MercurySable99](https://commons.wikimedia.org/?curid=128618894) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Angel | Genesis GV70 2022 | `6aced0aac98aa26ea0c34b4b` | [Kevauto](https://commons.wikimedia.org/?curid=113754793) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Nathan | Hyundai Elantra 2020 | `6aced0aec98aa26ea0c34b98` | [User3204](https://commons.wikimedia.org/?curid=134384271) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Khan | Kia Carnival 2023 | `6aced0a2c98aa26ea0c34ac3` | [Ethan Llamas](https://commons.wikimedia.org/?curid=154095502) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Kevin | Genesis GV80 2021 | `6aced0a6c98aa26ea0c34b12` | [MercurySable99](https://commons.wikimedia.org/?curid=137324180) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Angel | Hyundai Elantra 2020 | `6aced0aac98aa26ea0c34b50` | [Elise240SX](https://commons.wikimedia.org/?curid=104980912) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Nathan | Kia Carnival 2022 | `6aced0aec98aa26ea0c34b9d` | [Mr.choppers](https://commons.wikimedia.org/?curid=134032093) | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Khan | Hyundai Elantra 2019 | `6aced0a2c98aa26ea0c34ac8` | [Kevauto](https://commons.wikimedia.org/?curid=78727678) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Angel | Genesis GV80 2021 | `6aced0aac98aa26ea0c34b55` | [CChanSonichu](https://commons.wikimedia.org/?curid=87663178) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Nathan | Kia EV6 2023 | `6aced0aec98aa26ea0c34ba2` | [Corqe](https://commons.wikimedia.org/?curid=151815533) | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) |
| Khan | Kia EV6 GT 2023 | `6aced0a2c98aa26ea0c34acd` | [Kevauto](https://commons.wikimedia.org/?curid=156956807) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Nathan | Hyundai Kona 2023 | `6aced0afc98aa26ea0c34ba7` | [Corqe](https://commons.wikimedia.org/?curid=151786037) | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) |
| Angel | Kia EV6 2022 | `6aced0abc98aa26ea0c34b5a` | [DestinationFearFan](https://commons.wikimedia.org/?curid=116721772) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
