FROM node
VOLUME [ "/home/node/app" ]
WORKDIR /home/node/app

COPY run.sh /home/node

ENTRYPOINT [ "/home/node/run.sh" ]