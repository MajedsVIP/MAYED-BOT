x# Common build stage
FROM node:18-alpine3.15 as common-build-stage

COPY . ./app

WORKDIR /app

RUN npm install
RUN npm install discord.js
RUN npm install dotenv
RUN npm install node:fs
RUN npm install node:path

EXPOSE 3000

FROM common-build-stage as production-build-stage

ENV NODE_ENV production
ENV PORT 3000

CMD ["node", "src/server.js"]
