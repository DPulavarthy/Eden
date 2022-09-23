FROM node:latest
WORKDIR /home/eden
COPY package.json .
RUN npm install
CMD ["npm", "start"]