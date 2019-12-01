#!/bin/sh
set -e
sed -i 's#${LB_DOMAIN}#'${LB_DOMAIN}'#g' /usr/src/app/server.js
sed -i 's#${MONGO_USER}#'${MONGO_USER}'#g' /usr/src/app/server.js
sed -i 's#${MONGO_PASSWORD}#'${MONGO_PASSWORD}'#g' /usr/src/app/server.js
sed -i 's#${MONGO_DB_HOST}#'${MONGO_DB_HOST}'#g' /usr/src/app/server.js
sed -i 's#${MONGO_PORT}#'${MONGO_PORT}'#g' /usr/src/app/server.js
sed -i 's#${MONGO_DB_NAME}#'${MONGO_DB_NAME}'#g' /usr/src/app/server.js
sed -i 's#${MONGO_COLLECTION_NAME}#'${MONGO_COLLECTION_NAME}'#g' /usr/src/app/server.js
exec "$@"
