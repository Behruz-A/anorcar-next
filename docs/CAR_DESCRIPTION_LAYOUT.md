# Car Description multiline layout fix

The Nestar-derived MUI theme sets every MuiOutlinedInput root to height:48px. AddNewCar's Description uses a four-row autosized textarea: the browser measured 92px textarea height inside a 48px root, centered 22px above and below that root. This caused text to sit outside the white field and collide with its floating label.

Scoped fix in scss/car.scss: .car-form .MuiInputBase-root.MuiInputBase-multiline uses height:auto and align-items:flex-start. MUI continues to size the textarea; no hardcoded textarea height or theme-wide change. Also narrow the form fieldset reset to .car-form > fieldset so it no longer strips MUI's nested notched outline styling.

Existing TextField, minRows:4, controlled draft value, maximum 500 characters, optional 5-500 character validation, create/edit GraphQL payloads, permissions and Nestar component/SCSS architecture remain unchanged. No backend changes or new dependencies.

Validation results will be appended after the final browser run. The isolated script qa-car-description.cjs checks empty, short and six-line text at desktop/mobile widths, textarea containment, floating label separation, following checkbox-row spacing, hidden MUI measuring textarea, max length and page overflow, without live GraphQL mutations.

Verification: yarn.cmd typecheck and 91-page production build passed, with existing lint/Browserslist warnings. Isolated Chrome passed 1440px and 390px empty/short/six-line textarea containment, floating label separation, checkbox-row non-overlap, hidden autosize measuring textarea, unchanged maxlength 500 and no horizontal page overflow. Screenshots car-description-1440.png and car-description-390.png were visually inspected. No live mutations, backend modifications, commit or deployment. Temporary preview stopped after testing; existing development services remain running.
