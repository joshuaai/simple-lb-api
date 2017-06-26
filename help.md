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
process.env.NODE_ENV = 'test';
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

## Add Operation Hook to Loopback Model
We will add `before save` and `before delete` observers/hooks to our `product.js` and `category.js` models respectively:
```js
Product.observe('before save', function(ctx, next) {
  if (ctx.instance && ctx.instance.categoryId) {
    return Product.app.models.Category
      .count({id: ctx.instance.categoryId})
      .then(res => {
        if (res < 1) {
          return Promise
            .reject('Error adding product to nonexisting category');
        }
      });
  }
  return next();
});
```
```js
Category.observe('before delete', function(ctx) {
  return Category.app.models.Product
    .count({categoryId: ctx.where.id})
    .then(res => {
      if (res > 0) {
        return Promise.reject('Error deleting category with products');
      }
    });
});
```
Add the tests to the `product.test.js` and `category.test.js` respectively:
```js
describe('Hooks', function() {
  it('should not allow adding  product to a nonexisting category', function() {
    return Product.create({name: 'new category', price: 199, categoryId: 9999})
      .then(res => expect(res).to.equal(null))
      .catch(err => expect(err).to
        .equal('Error adding product to non-existing category'));
  });
});
```
```js
'use strict';
process.env.NODE_ENV = 'test';
const {app, expect} = require('../common');

// Get a reference to the product model
const Product = app.models.Product;
const Category = app.models.Category;

describe('Category', function() {
  describe('Hooks', function() {
    it('should not allow deleting a category with products', function() {
      return Promise.resolve()
        .then(() => Category.create({name: 'my category'}))
        .then(cat => Product
          .create({name: 'category-product', price: 299, categoryId: cat.id}))
        .then(res => Category.destroyById(res.categoryId))
        .then(res => expect(res).to.equal(null))
        .catch(err => expect(err).to
          .equal('Error deleting category with products'));
    });
  });
});
```

## Configure ACL's to Protect the API
```bash
lb acl
```
* ? Select the model to apply the ACL entry to: Product
* ? Select the ACL scope: All methods and properties
* ? Select the access type: All (match all types)
* ? Select the role Any unauthenticated user
* ? Select the permission to apply Explicitly deny access

To allow only `GET` access:
```bash
lb acl
```
* ? Select the model to apply the ACL entry to: Product
* ? Select the ACL scope: A single method
* ? Enter the method name find
* ? Select the role Any unauthenticated user
* ? Select the permission to apply Explicitly grant access

To apply the same rules to the `category.json` model, copy the contents of the `acl` array in `product.json` to the corresponding `acl` array in `category.json`.

To test this, add `acl.test.js`. We first install `supertest`:
```bash
npm install --save-dev supertest
```

We update the `test/common.js` to include:
```js
const supertest = require('supertest');

const expect = chai.expect;
const request = supertest(app);

module.exports = {
  app,
  expect,
  request,
};
```

Inside the `acl.test.js`, we add:
```js
'use strict';
process.env.NODE_ENV = 'test';
const {app, expect, request} = require('../common');

describe('ACL', function() {
  describe('Category', function() {
    it('should return 200 when listing Categories', function() {
      return request
        .get('/api/categories')
        .expect(200);
    });

    it('should return 401 when creating Category', function() {
      return request
        .post('/api/categories')
        .send({name: 'my-category'})
        .expect(401);
    });

    it('should return 401 when updating Category', function() {
      return request
        .patch('/api/categories/1')
        .send({name: 'new-name'})
        .expect(401);
    });

    it('should return 401 when deleting Category', function() {
      return request
        .delete('/api/categories/1')
        .expect(401);
    });
  });

  describe('Product', function() {
    it('should return 200 when listing Products', function() {
      return request
        .get('/api/products')
        .expect(200);
    });

    it('should return 401 when creating Product', function() {
      return request
        .post('/api/products')
        .send({name: 'my-product', price: 120})
        .expect(401);
    });

    it('should return 401 when updating Product', function() {
      return request
        .patch('/api/products/1')
        .send({name: 'new-name', price: 140})
        .expect(401);
    });

    it('should return 401 when deleting Product', function() {
      return request
        .delete('/api/products/1')
        .expect(401);
    });

    it('should return 200 when buying a product', function() {
      return app.models.Product.create({'name': 'test again', 'price': 100})
        .then(res => request
          .post(`/api/products/${res.id}/buy`)
          .send({'quantity': 100})
          .expect(200));
    });
  });
});
```

## Create a Boot Script to Run Code at the Start of API
We will use a boot script to create or update a predefined admin user, and give that user an Access Token. That way we don't have to log in to the API each time we want to use it as an authenticated user.

* Create a new user from the explorer
* At the `users/login` endpoint, copy the auth token and set it to the top of the app.
Now we can make requests that require authentication.

To have the api create an access token on start, we add a boot script.
```bash
lb boot-script
```

In the generate `server/boot/create-access-token.js` file, replace the contents with:
```js
'use strict';
const Promise = require('bluebird');

module.exports = function(app, cb) {
  const AccessToken = app.models.AccessToken;
  const User = app.models.User;
  const email = 'admin@example.com';
  const password = 's3cr3t';
  const accessToken = 's3cr3t';

  return Promise.resolve()
    .then(() => User.findOne({where: {email}}))
    .then(res => (res ? res : User.create({email, password})))
    .then(user => AccessToken.upsert({id: accessToken, userId: user.id}))
    .then(token => console.log('Access Token:', token.id))
    .asCallback(cb);
};
```

## Create a MongoDB DataSource in Loopback
```bash
touch server/datasources.local.js
```
We can dynamically control our data sources in this file. The contents are as follows:
```js
'use strict';

const mongodbUrl = process.env.MONGODB_URL;
if (mongodbUrl) {
  console.log('Using MongoDB url:', mongodbUrl);
  const dataSources = {
    db: {
      name: 'db',
      connector: 'mongodb',
      url: mongodbUrl,
    },
  };

  module.exports = dataSources;
};
```

```bash
npm install loopback-connector-mongodb --save
```

To run this, start a MongoDB server with `mongod.exe --auth --port 27017 --dbpath /data/db` and set it up in your project like so:
```bash
lb datasource

? Enter the datasource name: mongo1
? Select the connector for mongo1: MongoDB (supported by StrongLoop)
? Connection String url to override other settings (eg: mongodb://username:password@hostname:port/database):
? host: your-mongodb-server.foo.com
? port: 27017
? user: demo
? password: ****
? database: demo
? Install loopback-connector-mongodb@^1.4 Yes
```

Loopback has a [Defining Data Sources](http://loopback.io//doc/en/lb3/Defining-data-sources.html) documentation.

## Create a Free Database on MongoDB Atlas
After creating your cluster on Atlas, click the *connect* button in Clusters tab to get the connection string.