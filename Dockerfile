FROM node:13

WORKDIR /usr/src/fetch-holiday

COPY package*.json ./

RUN npm i

COPY . .

EXPOSE 3000

CMD ["npm", "start"]

