describe('DS.destroy(resourceName, id)', function () {
  function errorPrefix(resourceName, id) {
    return 'DS.destroy(' + resourceName + ', ' + id + '[, options]): ';
  }

  beforeEach(startInjector);

  it('should throw an error when method pre-conditions are not met', function () {
    DS.destroy('does not exist', 5).then(function () {
      fail('should have rejected');
    }, function (err) {
      assert.isTrue(err instanceof DS.errors.NonexistentResourceError);
      assert.equal(err.message, errorPrefix('does not exist', 5) + 'does not exist is not a registered resource!');
    });

    angular.forEach(TYPES_EXCEPT_STRING_OR_NUMBER, function (key) {
      DS.destroy('post', key).then(function () {
        fail('should have rejected');
      }, function (err) {
        assert.isTrue(err instanceof DS.errors.IllegalArgumentError);
        assert.equal(err.message, errorPrefix('post', key) + 'id: Must be a string or a number!');
      });
    });
  });
  it('should delete an item from the data store', function () {
    $httpBackend.expectDELETE('http://test.angular-cache.com/posts/5').respond(200, 5);

    DS.inject('post', p1);

    DS.destroy('post', 5).then(function (id) {
      assert.equal(id, 5, 'post 5 should have been deleted');
    }, function (err) {
      console.error(err.stack);
      fail('should not have rejected');
    });

    $httpBackend.flush();

    assert.equal(lifecycle.beforeDestroy.callCount, 1, 'beforeDestroy should have been called');
    assert.equal(lifecycle.afterDestroy.callCount, 1, 'afterDestroy should have been called');
    assert.isUndefined(DS.get('post', 5));
    assert.equal(DS.lastModified('post', 5), 0);
    assert.equal(DS.lastSaved('post', 5), 0);
  });
  it('should handle nested resources', function () {
    var testComment = {
      id: 5,
      content: 'test'
    };
    var testComment2 = {
      id: 6,
      content: 'test',
      approvedBy: 4
    };

    DS.inject('comment', testComment);

    $httpBackend.expectDELETE('http://test.angular-cache.com/user/4/comment/5').respond(204);

    DS.destroy('comment', 5, {
      params: {
        approvedBy: 4
      }
    }).then(function () {
    }, function () {
      fail('Should not have failed!');
    });

    $httpBackend.flush();

    $httpBackend.expectDELETE('http://test.angular-cache.com/user/4/comment/6').respond(204);

    DS.inject('comment', testComment2);

    DS.destroy('comment', 6, {
      bypassCache: true
    }).then(function () {
    }, function () {
      fail('Should not have failed!');
    });

    $httpBackend.flush();

    $httpBackend.expectDELETE('http://test.angular-cache.com/comment/6').respond(204);

    DS.inject('comment', testComment2);

    DS.destroy('comment', 6, {
      params: {
        approvedBy: false
      }
    }).then(function () {
    }, function () {
      fail('Should not have failed!');
    });

    $httpBackend.flush();
  });
});
