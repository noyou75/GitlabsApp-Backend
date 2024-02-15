FROM postgres:12

ENV POSTGIS_MAJOR 3

RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-$PG_MAJOR-postgis-$POSTGIS_MAJOR \
    && rm -rf /var/lib/apt/lists/*

COPY docker-healthcheck /usr/local/bin/

HEALTHCHECK --interval=5s --start-period=10s CMD ["docker-healthcheck"]
