'use strict';
process.env.NODE_ENV = 'test';
const {app, expect} = require('../common');

// Get a reference to the product model
const Category = app.models.Category;
const Product = app.models.Product;

describe('Category', function() {
  describe('Hooks', function() {
    it('should not allow deleting a category with products', function() {
      return Promise.resolve()
        .then(() => Category.create({name: 'my next category'}))
        .then(cat => Product.create({name: 'category-products now', price: 299, categoryId: cat.id}))
        .then(res => Category.destroyById(res.categoryId))
        .then(res => expect(res).to.equal(null))
        .catch(err => expect(err).to.equal('Error deleting category with products'));
    });
  });
});
