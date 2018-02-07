FROM node
VOLUME [ "/home/node/app" ]
WORKDIR /home/node/app

CMD [ "./run.sh" ]