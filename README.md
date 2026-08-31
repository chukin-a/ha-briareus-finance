# HA Briaureus Finance

Minimal Home Assistant add-on starter with:

- NestJS backend
- Angular frontend
- Home Assistant Ingress
- persistent `/config`
- SQLite-ready layout
- UAH configuration

## Local addon repository

Copy the repository to:

`/addons/ha-finance`

Then in Home Assistant:

Settings → Add-ons → Add-on Store → ⋮ → Check for updates

## Health endpoint

Inside Ingress:

`./api/health`

## Next steps

1. Add SQLite schema/migrations.
2. Add Accounts / Transactions / Categories / Budgets.
3. Add Monobank connector.
4. Add HA API service for sensors/events.
5. Add authentication/Ingress awareness.
