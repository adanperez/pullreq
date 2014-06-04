# Quick docker file that can be used to create an image of the local working files.
# For help building see the make Makefile in the current directory.

FROM ubuntu:14.04

RUN apt-get update
RUN apt-get -y install nodejs nodejs-legacy npm
ADD docker-build /app
WORKDIR /app
RUN npm install
RUN ./node_modules/bower/bin/bower install --allow-root --force --config.interactive=0
RUN ./node_modules/grunt-cli/bin/grunt prod-assemble
ENTRYPOINT node src/js/server/server.js
