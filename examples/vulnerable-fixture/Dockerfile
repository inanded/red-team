# DO NOT DEPLOY THIS IMAGE.
# This Dockerfile builds the red-team pack's intentionally-vulnerable smoke-test
# fixture. It contains twenty planted security defects. The image is NOT safe to
# run on any network-reachable host. See README.md in this directory for details.
FROM node:20

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
