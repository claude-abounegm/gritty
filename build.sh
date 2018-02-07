#!/bin/bash

docker() {
    MSYS_NO_PATHCONV=1 docker.exe "$@"
}
export -f docker

# this will fail on Windows
npm install
npm run build

# build with docker
docker build . -t gritty_build
docker run --name="gritty_build" -v "$(pwd):/home/node/app" gritty_build
docker rm -f "gritty_build"
docker image rm -f gritty_build