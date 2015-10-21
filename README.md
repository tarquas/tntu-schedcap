# tntu-schedcap

TNTU Schedule Capture REST API Server

## Install or Keep Updated Deps

`npm i`

## Code Linting

`node lint`

## Local Testing

`npm test`

Use `TESTING_NODROPDB=1 NODE_ENV=testing npm start` to debug last testing session.

## Local Run

`npm start`

## First Deploy

`sudo npm i -g node-gyp pm2`

`npm i`

`sudo env TOKEN_SECRET="someTokenSecret" node pm2` -- where `someTokenSecret` is of A-Z, a-z, 0-9. 

## Post-Update on Next Deploys

`sudo pm2 stop api`

`npm i`

`sudo pm2 start api`

## Check Production Status

`sudo pm2 show api`

## Undeploy

`sudo pm2 delete api`

## Notes

If your console terminal support colors, but you see all `node lint`, `npm test`
etc. output in monochrome, you may take advantage of colorful text information display
by exposing shell command to that console (for a GNU/Linux OS):

`export TERM=linux`
