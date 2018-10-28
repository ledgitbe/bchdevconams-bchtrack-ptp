FROM node:10.9.0-alpine

RUN apk add git
RUN mkdir /app
WORKDIR /app
ADD package.json ./
ADD .env ./
RUN npm install
COPY . .

CMD ["npm", "start"]
