FROM node:20.13.1-bookworm-slim

WORKDIR /app

COPY package*.json .

RUN npm install

COPY prisma ./prisma/

RUN npx prisma generate

COPY . .

EXPOSE 4001

CMD ["npm", "run", "dev"]
