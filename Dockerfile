FROM node:10.9.0-alpine

RUN apk add git
RUN mkdir /app
WORKDIR /app
ADD package.json ./
RUN npm install
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
