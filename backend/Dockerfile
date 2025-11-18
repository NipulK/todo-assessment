FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY . .

ENV DATABASE_URL="mysql://todo_user:todo_pass@db:3306/todo"
RUN npx prisma generate

EXPOSE 4000
CMD ["npx", "ts-node", "src/index.ts"]
