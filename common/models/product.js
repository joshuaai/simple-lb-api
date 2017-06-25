'use strict';

module.exports = function(Product) {
  Product.observe('before_save', function(ctx, next) {
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
};
