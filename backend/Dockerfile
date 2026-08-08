FROM node:22-alpine

RUN apk add --no-cache tzdata
ENV TZ=America/Guayaquil

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

CMD ["node", "src/server.js"]
