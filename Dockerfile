FROM node:20.10.0-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN chown -R node:node /app

USER node

EXPOSE 3212

CMD [ "npm", "run", "build" ]
