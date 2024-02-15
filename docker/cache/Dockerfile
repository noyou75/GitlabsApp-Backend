FROM redis:5.0

COPY docker-healthcheck /usr/local/bin/

HEALTHCHECK --interval=5s --start-period=10s CMD ["docker-healthcheck"]
