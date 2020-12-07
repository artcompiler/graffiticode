FROM node:14-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

RUN npm ci --production

CMD [ "node", "-r", "./tracing.js", "app.js" ]
USER node

