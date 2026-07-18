# Railway API deployment

The Railway service must use the repository-root `railway.toml`. It builds and starts the
Express API from `server/`, rather than auto-detecting the root Expo package, and probes
`/api/health` before routing traffic.

The production service also requires a persistent `/data` volume and the environment
variables listed in [`PAYMENTS_DEPLOYMENT.md`](PAYMENTS_DEPLOYMENT.md), including
`YOTICKS_DB_FILE=/data/yoticks.db`, a strong `JWT_SECRET`, and an HTTPS
`PASSWORD_RESET_WEBHOOK_URL`. If the service starts the root Expo package or fails those
startup guards, the browser may surface the outage as a misleading CORS error because no
API response reaches the CORS middleware.
