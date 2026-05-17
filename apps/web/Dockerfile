FROM node:20-alpine AS base
WORKDIR /app

COPY package.json tsconfig.base.json .
COPY apps/web/package.json apps/web/package.json
COPY shared shared

RUN npm install

COPY . .

RUN npm run build --workspace @lms/web

EXPOSE 3000
CMD ["npm", "run", "start", "--workspace", "@lms/web"]
