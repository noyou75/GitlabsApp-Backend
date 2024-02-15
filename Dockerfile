FROM node:14.15.1-alpine AS root

# ---

FROM root AS builder

ARG version
ARG sentry_auth_token
ENV VERSION=$version
ENV SENTRY_AUTH_TOKEN=$sentry_auth_token

LABEL maintainer="Bart Wegrzyn <bart@getlabs.com>"

RUN apk add --no-cache build-base g++ python2 cairo-dev pango-dev jpeg-dev

WORKDIR /app

COPY ./package.json /app/
COPY ./yarn.lock /app/

RUN yarn install

COPY . /app/

RUN yarn build

RUN if [[ -n "$SENTRY_AUTH_TOKEN" ]]; then \
  ./node_modules/.bin/sentry-cli releases new ${version} --finalize \
    && ./node_modules/.bin/sentry-cli releases set-commits ${version} --commit "getlabs-app/getlabs-api@${version}" \
    && ./node_modules/.bin/sentry-cli releases files ${version} upload-sourcemaps /app/dist -x .js -x .map --rewrite --strip-common-prefix; \
  else \
    echo "SENTRY_AUTH_TOKEN env var not set, skipping sourcemap upload"; \
  fi

# ---

FROM root

ARG version
ENV VERSION=$version

RUN apk add --no-cache tini chromium imagemagick graphicsmagick

WORKDIR /app

USER node

COPY --from=builder /app/package.json /app/
COPY --from=builder /app/dist/ /app/dist/
COPY --from=builder /app/node_modules/ /app/dist/node_modules/

# This line shouldn't be needed as the build process should copy in these assets, but it seems to randomly break...?
COPY --from=builder /app/src/views/ /app/dist/src/views/

ENV PATH /app/dist/node_modules/.bin:$PATH

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "dist/src/main"]
