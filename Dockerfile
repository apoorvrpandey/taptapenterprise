# Use the official Node.js image.
FROM --platform=linux/amd64 node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
COPY package*.json ./

# Install dependencies.
RUN npm install

# Copy local code to the container image.
COPY . .

# Build the service
RUN npm run build

# Specify the command to run on container start
CMD [ "npm", "start" ]

# Expose the application port
EXPOSE 4004
