# REST API with Loopback
```bash
npm install -g loopback-cli

lb -v
```

## Setting up New App
```bash
mkdir simple-lb-api

lb app
```
The `lb app` command will bring up an interactive interface. Select the project and directory names, version `3.x` and finally the *api-server (A LoopBack API server with local User auth)* option for type of app.
```bash
cd simple-lb-api
node .
```

## Creating a Model
```bash
lb model
```
* This will prompt for model a name (singular). 
* Select `db (memory)` to use local memory.
* Select model's base class as `PersistedModel`.
* Expose the product via REST (yes).
* Accept the default plural form for the REST URL (yes).
* Select `common` to add the model definitions to the `common` folder.
* Add a model property - type (String etc) and required (yes or no), with no default value. (Added the name an price properties). Hit enter to escape.

To persist data memory, add to the `datasources.json` file inside the `db` object a file key:
```json
"file": "db.json"
```