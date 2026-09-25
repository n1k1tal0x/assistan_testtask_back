FROM node:22-alpine
RUN apk add --no-cache git
WORKDIR /app
COPY frontend-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 5173
ENTRYPOINT ["/entrypoint.sh"]
