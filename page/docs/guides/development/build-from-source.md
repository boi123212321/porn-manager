# Build from source

- Install [Git](https://git-scm.com/)
- Install [Node.js](https://nodejs.org/en/)
- Clone the repository
  - `git clone https://github.com/porn-vault/porn-vault.git`
- Install dependencies
  - `npm install`
- Build web app dependencies
  - `cd app`
  - `npm install`

## Main scripts

- Run web app in dev mode (in `./app` folder)
  - `npm run serve`
- Build web app (in `./app` folder)
  - `npm run build`
- Transpile server (in root folder)
  - `npm run transpile:prod`: main transpilation script
  - OR
  - `npm run transpile:dev`: with additional options to enable debugging
  - OR
  - `npm run watch` (same as the dev script, but will retranspile every time the sources change)
- Run server in dev mode (in root folder)
  - `npm run mon`
- Run server in release mode (in root folder)
  - `npm run prod:once`
- Run packaged server+app in release mode (in root folder)
  - `npm run build:generic`
  - And run the built executable in the release/ folder
  - Building for specific node targets is available via `build:<platform>`, see the scripts in package.json

If you want to run Porn-Vault with minimal packaging, you must at least build the app, but for the server you may choose any transpilation or build script. It only requires the app to be built and available in `./app/dist` (relative to the current working directory)

## Debugging in Visual Studio Code

1. First transpile the sources with the `transpile` or `watch` script

2. Add the following to your `.vscode/launch.json` configuration in the project folder:

```json
{
  "name": "Launch pre-transpiled build/ via nodemon",
  "type": "node",
  "request": "launch",
  "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/nodemon",
  "program": "${workspaceFolder}/build",
  "restart": true,
  "console": "externalTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

> This corresponds to the `mon` script

3. ????
4. PROFIT!!!
