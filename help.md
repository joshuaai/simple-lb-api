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

## Add Validation Rules to Models
Loopback has some [validation rules for models](https://loopback.io/doc/en/lb2/Validating-model-data.html) that we can use to add validation to our API.

In `product.js`, add the following validation rules:
```js
// Validate minimal length of the name
Product.validatesLengthOf('name', {
  min: 3,
  message: {
    min: 'Name should be at least three characters',
  },
});

// Validate the name to be unique
Product.validatesUniquenessOf('name');

const positiveInteger = /^[0-9]*$/;

const validatePositiveInteger = function(err) {
  if (!positiveInteger.test(this.price)) {
    err();
  }
};

Product.validate('price', validatePositiveInteger, {
  message: 'Price should be a positive integer',
});

function validateMinimalPrice(err, done) {
  const price = this.price;
  process.nextTick(() => {
    const minimalPriceFromDb = 99;
    if (price < minimalPriceFromDb) {
      err();
    }
    done();
  });
}

Product.validateAsync('price', validateMinimalPrice, {
  message: 'Price should be higher than the minimal price in the db',
});
```

## Add Unit Tests to Loopback API Project
```bash
npm install --save-dev mocha chai
```
In `package.json` scripts object, replace:
```json
"posttest": "npm run lint && nsp check"
```
with:
```json
"test": "mocha test/**/*.test.js",
"test:watch": "npm run test -- --watch"
```
The `.test.js` script runs mocha and all the files with the extension `.test.js` in the test folder.

Create a new `test` directory at the project root and a `common.js` file with the contents:
```js
'use strict';
// create a reference to our server
const app = require('../server/server');
const chai = require('chai');
const expect = chai.expect;

module.exports = {
  app,
  expect,
};
```

Create the unit folder and add `product.test.js` with the contents:
```js
'use strict';

const {app, expect} = require('../common');

// Get a reference to the product model
const Product = app.models.Product;

describe('It should resolve', function() {
  it('a Product.find', function() {
    return Product
      .find()
      .then(res => console.log(res));
  });
});
```

To ensure the tests don't use our default database connector, we override the data source for the specific node environment, which is `test` in this case, by updating our package.json as follows:
```json
// for windows
"test": "SET NODE_ENV=test & mocha test/**/*.test.js",
// and for Linux
"test": "NODE_ENV=test mocha test/**/*.test.js",
```

We then add a `server/datasources.test.json` file with th contents:
```js
{
  "db": {
    "name": "db",
    "connector": "memory",
    "file": false
  }
}
```

Now add proper tests to the `product.test.js` file:
```js
describe('Custom methods', function() {
  it('should allow buying a product', function() {
    const product = new Product({name: 'buy-product', price: 299});
    return product.buy(10, function(err, res) {
      expect(res.status).to.contain('You bought 10 product(s)');
    });
  });

  it('should not allow buying a negative product quantity', function() {
    const product = new Product({name: 'buy-product', price: 299});
    return product.buy(-10, function(err, res) {
      expect(err).to.contain('Invalid quantity -10');
    });
  });
});

describe('Validation', function() {
  it('should reject a name < 3 characters', function() {
    return Product.create({name: 'a', price: 299})
      .then(res => Promise.reject('Product should not be created'))
      .catch(err => {
        expect(err.message).to
          .contain('Name should be at least three characters');
        expect(err.statusCode).to.be.equal(422);
      });
  });

  it('should reject a duplicate name', function() {
    return Promise.resolve()
      .then(() => Product.create({name: 'abc', price: 299}))
      .then(() => Product.create({name: 'abc', price: 299}))
      .then(() => Promise.reject('Product should not be created'))
      .catch(err => {
        expect(err.message).to.contain('Details: `name` is not unique');
        expect(err.statusCode).to.be.equal(422);
      });
  });

  it('should reject a price < 0', function() {
    return Product.create({name: 'lowPrice', price: -1})
      .then(res => Promise.reject('Product should not be created'))
      .catch(err => {
        expect(err.message).to.contain('Price should be a positive integer');
        expect(err.statusCode).to.be.equal(422);
      });
  });

  it('should reject a price < 99', function() {
    return Product.create({name: 'lowPrice', price: 98})
      .then(res => Promise.reject('Product should not be created'))
      .catch(err => {
        expect(err.message).to
          .contain('Price should be higher than the minimal price in the db');
        expect(err.statusCode).to.be.equal(422);
      });
  });

  it('should store a correct product', function() {
    return Product.create({name: 'all great', price: 100})
      .then(res => {
        expect(res.name).to.equal('all great');
        expect(res.price).to.be.equal(100);
      });
  });
});
```