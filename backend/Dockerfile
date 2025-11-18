FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci

COPY prisma ./prisma
COPY . .

ENV DATABASE_URL="mysql://todo_user:todo_pass@db:3306/todo"
RUN npx prisma generate

EXPOSE 4000
CMD ["npx", "ts-node", "src/index.ts"]
