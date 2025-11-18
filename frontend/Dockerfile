FROM node:18-alpine
WORKDIR /app

COPY zapping-zero/package*.json ./
RUN npm install

COPY zapping-zero/ .

RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "preview"]
