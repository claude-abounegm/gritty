#!/bin/bash

docker() {
    MSYS_NO_PATHCONV=1 docker.exe "$@"
}
export -f docker

# this will fail on Windows
if [[ $1 != "test" ]]; then
    (
        npm install;
        npm run build;
    )
fi

# build with docker
docker build . -t gritty_build
docker rm -f gritty_build
docker run --rm --name="gritty_build" -v "$(pwd):/home/node/app" gritty_build "$1"
docker image rm -f gritty_build