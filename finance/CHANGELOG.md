# Changelog

## 0.5.2

- Replaced the category expense list with a root-category pie chart.
- Added drill-down into child categories and direct root-category expenses.
- Added transaction details for the selected category branch.

## 0.5.1

- Included opening credit-card debt in the previous grace-period obligation.
- Credit-card obligations now show separate amounts for the current and previous periods.

## 0.5.0

- Fixed grace-period status propagation to future credit-card obligations until the full debt is repaid.
- Restarted the grace period only after the card debt reaches zero and a new credit purchase occurs.
- Budget progress now follows the selected calendar period instead of fixed budget dates.

## 0.4.9

- Fixed credit-card grace-period calculations by separating obligations by spending month.
- Applied card top-ups to the oldest outstanding period before the current period.
- Added calendar-month migration for existing budgets and support for monthly, quarterly, and yearly budgets.

## 0.4.8

- Added backend coverage for financial domain rules, planning, security, SSE, heartbeat, outbox delivery, and DPS receipt parsing.
- Added frontend unit/component coverage for periods, categories, transactions, payments, summaries, and QR scanning.
- Added Playwright E2E coverage for transaction creation and account preference persistence.
- Fixed receipt refresh visibility when DPS requests are disabled.
- Added test-result artifacts to `.gitignore`.

## 0.4.7

- Remembered the last account selected for a new transaction.
- Restored the saved account after component remounts and add-on navigation.

## 0.4.6

- Added the `tax_api_enabled` Home Assistant add-on option.
- Disabled DPS requests and hid receipt refresh when the option is off.

## 0.4.5

- Added the `tax_api_enabled` Home Assistant add-on option.
- Disabled DPS requests and hid receipt refresh when the option is off.

## 0.4.4

- Added a non-persistent DPS response diagnostic for failed receipt lookups.
- Receipt lookup errors now show the upstream HTTP status and sanitized response body.

## 0.4.3

- Trimmed the DPS API token before lookup.
- Exposed the sanitized DPS error response for failed receipt lookups.

## 0.4.2

- Simplified DPS receipt lookup to the required `id`, `type`, and token parameters.
- Removed optional QR date, time, and fiscal-device filters from the lookup request.

## 0.4.1

- Fixed DPS receipt lookup by preserving the QR code time parameter.
- Reconstructed the full DPS date-time filter for existing QR transactions.

## 0.4.0

- Improved fiscal receipt lookup through the DPS public API.
- Fixed QR date handling when the code contains a date without time.
- Added safe propagation of DPS API error messages.
- Added receipt item extraction from namespaced and variant XML structures.
- Added manual receipt data refresh from transaction details.
- Moved receipt processing into the transactions module.
- Removed legacy photo upload/OCR fallback and cleaned up stored receipt drafts and photos.

## 0.3.9

- Fixed fiscal receipt item extraction for namespaced and extended DPS XML fields.
- Added manual refresh of receipt data from the transaction details view.

## 0.3.8

- Moved fiscal receipt lookup and parsing into the transactions module.
- Removed legacy photo upload/OCR fallback and receipt screens from planning.
- Added a migration that removes obsolete receipt drafts and stored receipt photos.
- Fiscal receipt data is now kept as transaction metadata and receipt item positions.

## 0.3.7

- Improved fiscal QR scanning speed by optimizing camera resolution and scan intervals.

## 0.3.6

- Added semi-offline fiscal QR processing: amount, date, and receipt ID are filled locally before background tax-register enrichment.

## 0.3.5

- Added a visual QR scanning frame and guidance overlay in the camera scanner.

## 0.3.4

- Added a transaction-toolbar action for local fiscal receipt QR scanning and lookup through the State Tax Service register.

## 0.3.3

- Added local QR scanning for fiscal receipt URLs and lookup through the State Tax Service register.

## 0.3.2

- Added a secret Home Assistant add-on option for the State Tax Service fiscal receipt API token.

## 0.3.1

- Fixed local Home Assistant app image builds by using the multi-platform base image directly in the Dockerfile.

## 0.3.0

- Added SSE heartbeat for stable long-lived Ingress connections.
- Added realtime updates for budgets, recurring payments, installments, categories, accounts, projects, transfers, and imports.
- Added ownership and administrator access checks for accounts, projects, budgets, and recurring rules.
- Added compact mobile navigation and transaction actions.
- Removed the deprecated `build.yaml` build configuration.

## 0.2.0

- Added realtime updates for shared finance data through SSE.
- Added editing for budgets and transactions.
- Added compact transaction and planning interfaces.
- Added hierarchical category selection and display.
- Added account ownership and access checks.

## 0.1.7

- Added recurring payments, installments, payments calendar, analytics, and user access management.
