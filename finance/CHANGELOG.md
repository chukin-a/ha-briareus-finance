# Changelog

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
