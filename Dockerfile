FROM node:4

# Bundle app source
COPY . /src

WORKDIR /src

# native BSON fix
RUN npm i -g node-gyp

# Install app dependencies
RUN npm i

# Run App
CMD ["npm", "start"]
