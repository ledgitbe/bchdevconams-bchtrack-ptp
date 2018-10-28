FROM node:10.9.0-alpine

RUN mkdir /app
WORKDIR /app
ADD package.json ./
RUN npm install
COPY . .
RUN GENERATE_SOURCEMAP=false npm run build

EXPOSE 3000

CMD ["npm", "start"]
