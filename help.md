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

## Add Development Mode to the Project
```bash
npm install --save-dev nodemon
```
Inside the `scripts` section of our `package.json` file, we add the `dev` key:
```json
"dev": "nodemon server/server.js --watch common --watch server"
```
This will restart the Loopback server when it detects changes from watching the `common` and `server` directories.

Start the server with `npm run dev`.

## Create a Relation between Two Loopback Models
```bash
lb model Category
```
Use the same settings as in the `Product` model above. Add only a `name` property.

To create the relation:
```bash
lb property
```
* Select the `Product` model.
* Give it a property name of `categoryId` and property type of `number`.
* Make it not required and no default value.

```bash
lb relation
```
On first run, select the `Category` model, `has many` attribute on `Product` model and `products` as the name of the relation (i.e. a category has many products). Add `categoryId` as the foreign key.

On the second run, select the `Product` model, `belongs to` attribute `Category` model and `category` as the name for the relation (i.e. a product belongs to a category). Add `categoryId` as the foreign key. 

## Define a Remote Method on a Loopback Model
```bash
lb remote-method
```
* ? Select the model: Product
* ? Enter the remote method name: buy
* ? Is Static? No
* ? Description for method: Buy this product

Let's configure where to expose your new method in the public REST API.
You can provide multiple HTTP endpoints, enter an empty path when you are done.
* ? Enter the path of this endpoint: /buy
* ? HTTP verb: post

Let's add another endpoint, enter an empty name when done.
* ? Enter the path of this endpoint:

Describe the input ("accepts") arguments of your remote method.
You can define multiple input arguments.
Enter an empty name when you've defined all input arguments.
* ? What is the name of this argument? quantity
* ? Select argument's type: number
* ? Is this argument required? Yes
* ? Please describe the argument: number of products to buy
* ? Where to get the value from? (auto)

Let's add another accept argument, enter an empty name when done.
* ? What is the name of this argument?

Describe the output ("returns") arguments to the remote method's callback function.
You can define multiple output arguments.
Enter an empty name when you've defined all output arguments.
* ? What is the name of this argument? result
* ? Select argument's type: object
* ? Is this argument a full response body (root)? Yes
* ? Please describe the argument: The result of the purchase

In the `product.js` file, add the method body:
```js
/**
  * Buy this product
  * @param {number} quantity number of products to buy
  * @param {Function(Error, object)} callback
*/

const validQuantity = quantity => Boolean(quantity > 0);

Product.prototype.buy = function(quantity, callback) {
  if (!validQuantity(quantity)) {
    return callback(`Invalid quantity ${quantity}`);
  }
  const result = {
    status: `You bought ${quantity} product(s)`,
  };
  // TODO
  callback(null, result);
};
```