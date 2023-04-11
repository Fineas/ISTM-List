# ==== CONFIGURE =====
FROM node:18.11.0-alpine

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh python3 make

RUN ln -s /usr/bin/python3 /usr/bin/python

# Set the working directory to /app inside the container
WORKDIR /app
# Copy app files
# RUN apt-get install git
# ==== BUILD =====
# Install dependencies (npm ci makes sure the exact versions in the lockfile gets installed)
COPY ./package*.json ./
COPY . .
RUN ls -al
# RUN npm install  --legacy-peer-deps --loglevel verbose
RUN yarn install
# Build the app
# RUN npm run build
# ==== RUN =======
# Set the env to "production"
ENV NODE_ENV production
# Expose the port on which the app will be running (3000 is the default that `serve` uses)
EXPOSE 3000
# Start the app
CMD [ "npm", "start" ]