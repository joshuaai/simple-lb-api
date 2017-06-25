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
