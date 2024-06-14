FROM node:20-alpine 
# Set working directory
WORKDIR /usr/src/app

# Copy app dependencies
COPY package.json .
RUN npm install --force

COPY . .
RUN npm run build

CMD [ "npm","run" ,"start" ]

EXPOSE 3000
