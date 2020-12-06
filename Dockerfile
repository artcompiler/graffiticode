FROM node:14

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

RUN npm run build

# If you are building your code for production
RUN npm ci --only=production

EXPOSE 3000
CMD [ "node", "-r", "./tracing.js", "app.js" ]

