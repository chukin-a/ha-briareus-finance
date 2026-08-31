ARG BUILD_FROM

FROM node:22-alpine AS frontend-build
WORKDIR /src/frontend
COPY app/frontend/package*.json ./
RUN npm install
COPY app/frontend/ ./
RUN npm run build

FROM node:22-alpine AS backend-build
WORKDIR /src/backend
COPY app/backend/package*.json ./
RUN npm install
COPY app/backend/ ./
RUN npm run build

FROM ${BUILD_FROM}
RUN apk add --no-cache nodejs npm
WORKDIR /app

COPY app/backend/package*.json ./
RUN npm install --omit=dev

COPY --from=backend-build /src/backend/dist ./dist
COPY --from=frontend-build /src/frontend/dist ./public
COPY run.sh /run.sh
RUN chmod a+x /run.sh

CMD ["/run.sh"]
