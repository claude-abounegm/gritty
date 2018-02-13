#!/bin/bash

if [[ $1 != "test" ]]; then
    rm -rf ./node_modules/node-pty-prebuilt
    npm install
    npm run build
else
    npm run test  
fi