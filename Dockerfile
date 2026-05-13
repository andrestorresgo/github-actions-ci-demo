# build stage
FROM oven/bun:1 AS build

WORKDIR /app

# Copy dependencies
COPY bun.lock package.json ./

# Build dependencies
RUN bun install --frozen-lockfile --production --ignore-scripts --verbose

COPY . .

# RUN bun build
RUN bun build --compile --minify --sourcemap ./src --outfile hono-docker-app

# runner stage
FROM gcr.io/distroless/base-debian12:nonroot AS runner

ENV NODE_ENV=production

WORKDIR /app

ARG BUILD_APP_PORT=3000
ENV APP_PORT=${BUILD_APP_PORT}
EXPOSE ${APP_PORT}

# Copy the compiled executable from the build stage
COPY --from=build /app/hono-docker-app .

ENTRYPOINT ["./hono-docker-app"]
