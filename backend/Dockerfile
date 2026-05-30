FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

EXPOSE 4000

CMD ["sh", "-c", "bunx prisma generate && bun run dev 2>&1 | cat"]
