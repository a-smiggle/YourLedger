# Your Ledger Product Tasks

## Foundation

- [x] Persist `UserData` and `BankData` in local storage so seeded data becomes the real app state.
- [x] Replace remaining `demoProfile` and `scenarioSummaries` consumers with reads from persisted app data.
- [x] Apply `BankData` overrides on top of loaded bank products before scenario calculations run.

## Household Data Entry

- [ ] Build editable household member forms for income, bonus, rental income, and HECS/HELP settings.
- [ ] Support add, edit, reorder, and remove flows for household members.
- [ ] Build expense entry forms for all monthly expense categories used by the engine.
- [ ] Build assets entry forms with support for cash, property, super, vehicle, and other categories.
- [ ] Build liabilities entry forms with support for home loans, credit cards, personal loans, car loans, and other debts.
- [ ] Add client-side validation for all monetary, percentage, and count inputs.
- [ ] Add clear empty states and sensible defaults when a user has no members, assets, liabilities, or scenarios.

## Scenario Management

- [ ] Build scenario create, edit, duplicate, and delete flows backed by `UserData.scenarios`.
- [ ] Allow each scenario to choose a lender and product from resolved bank data.
- [ ] Allow per-scenario overrides for interest rate, assessment buffer, loan term, and notes.
- [ ] Keep `selectedScenarioId` in sync with scenario CRUD operations.
- [ ] Show scenario comparison outputs in both chart and tabular form.

## Lender And Product Data

- [ ] Turn the lenders route into a usable lender directory with product details, policy summaries, and filtering.
- [ ] Expose effective bank policy and product values after overrides are merged.
- [ ] Add UI flows to edit bank policy overrides and product overrides locally.
- [ ] Support hiding and restoring products through override state.
- [ ] Add refresh-state messaging and failure handling for bank data updates.

## Calculation Engine

- [ ] Expand serviceability logic so expenses, liabilities, rental shading, bonus shading, and HECS/HELP loadings are all traceable in outputs.
- [ ] Add a dedicated repayment calculator flow beyond the borrowing power calculation.
- [ ] Add offset-vs-no-offset calculation support where product features allow it.
- [ ] Add cashflow projection logic over time.
- [ ] Add debt and LVR trajectory calculations.
- [ ] Add interest rate sensitivity calculations for scenario stress testing.
- [ ] Move any remaining hard-coded lending assumptions into config-driven values.
- [ ] Add rule-driven interpretation notes so results explain why capacity increased or decreased.

## Results And Charts

- [ ] Expand the results page to show borrowing power, repayments, monthly surplus, assessed rate, assets, liabilities, and net position clearly.
- [ ] Add cashflow over time charts.
- [ ] Add debt and LVR trajectory charts.
- [ ] Add interest rate sensitivity charts.
- [ ] Ensure every chart updates in real time from persisted state.
- [ ] Ensure chart layouts and labels are readable on mobile screens.

## Data Management

- [ ] Add export of the full app state to JSON.
- [ ] Add import of previously exported JSON with validation and schema checks.
- [ ] Add reset and clear-data actions for local state.
- [ ] Add storage migration handling for future schema versions.
- [ ] Add recovery handling for corrupt or partial local storage payloads.

## Privacy, Transparency, And Content

- [ ] Expand the How This Works page so it clearly explains calculation logic, buffers, assumptions, privacy, and data storage.
- [ ] Add a clear general-information disclaimer anywhere results are shown.
- [ ] Review all routes for placeholder or scaffold copy and replace it with finished product content.
- [ ] Ensure sponsored areas stay visually distinct and never interact with calculator data.

## UX, Accessibility, And Polish

- [ ] Add loading and hydration-safe states anywhere persisted browser data is required.
- [ ] Improve navigation so primary tasks are obvious on desktop and mobile.
- [ ] Add success, error, and confirmation feedback for destructive or data-management actions.
- [ ] Audit keyboard access, focus states, semantic markup, and screen-reader labels.
- [ ] Audit responsive layouts across landing, dashboard, forms, charts, and results routes.
- [ ] Remove remaining scaffold-only presentation details that make the product feel unfinished.

## Testing And Release Readiness

- [ ] Add unit tests for borrowing power, repayment, scenario summary, and bank override logic.
- [ ] Add tests for local storage hydration, import, export, reset, and migration behavior.
- [ ] Add component or integration coverage for the core user flows.
- [ ] Add a repeatable pre-release validation checklist covering lint, build, and manual browser QA.
- [ ] Verify the app works cleanly in current desktop and mobile browsers.
- [ ] Review README and in-app copy so the documented behavior matches the shipped product.