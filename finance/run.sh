#!/usr/bin/with-contenv bashio

export PORT=3000
export DATA_DIR=/config
export DB_PATH=/config/finance.sqlite
export CURRENCY="$(bashio::config 'currency')"
export TZ="$(bashio::config 'timezone')"
export HA_SENSORS_ENABLED="$(bashio::config 'sensors_enabled')"
export HA_REFRESH_INTERVAL="$(bashio::config 'sensor_refresh_interval')"
export WARNING_DAYS="$(bashio::config 'warning_days')"
export UPLOAD_LIMIT_MB="$(bashio::config 'upload_limit_mb')"

exec node /app/dist/main.js
