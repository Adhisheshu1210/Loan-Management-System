FROM node:20-alpine AS base
WORKDIR /app

COPY package.json tsconfig.base.json .
COPY apps/api/package.json apps/api/package.json
COPY shared shared

RUN npm install

COPY . .

RUN npm run build --workspace @lms/api

EXPOSE 5000
CMD ["npm", "run", "start", "--workspace", "@lms/api"]
