FROM node:18-alpine
WORKDIR /app

COPY zapping-zero/package*.json ./
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --legacy-peer-deps

COPY zapping-zero/ .

RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "preview"]
