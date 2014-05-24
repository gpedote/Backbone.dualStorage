// Generated by CoffeeScript 1.7.1
var $, LocalStorageAdapter, S4, StickyStorageAdapter, backboneSync, callbackTranslator, dualSync, getStoreName, localSync, modelUpdatedWithResponse, onlineSync, parseRemoteResponse,
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

$ = Backbone.$;

LocalStorageAdapter = (function() {
  function LocalStorageAdapter() {}

  LocalStorageAdapter.prototype.initialize = function() {
    return $.Deferred().resolve;
  };

  LocalStorageAdapter.prototype.setItem = function(key, value) {
    localStorage.setItem(key, value);
    return $.Deferred().resolve(value);
  };

  LocalStorageAdapter.prototype.getItem = function(key) {
    return $.Deferred().resolve(localStorage.getItem(key));
  };

  LocalStorageAdapter.prototype.removeItem = function(key) {
    localStorage.removeItem(key);
    return $.Deferred().resolve();
  };

  return LocalStorageAdapter;

})();

StickyStorageAdapter = (function() {
  function StickyStorageAdapter(name) {
    this.name = name || 'Backbone.dualStorage';
  }

  StickyStorageAdapter.prototype.initialize = function() {
    var promise;
    promise = $.Deferred();
    this.store = new StickyStore({
      name: this.name,
      adapters: ['indexedDB', 'webSQL', 'localStorage'],
      ready: function() {
        return promise.resolve();
      }
    });
    return promise;
  };

  StickyStorageAdapter.prototype.setItem = function(key, value) {
    var promise;
    promise = $.Deferred();
    this.store.set(key, value, function(storedValue) {
      return promise.resolve(storedValue);
    });
    return promise;
  };

  StickyStorageAdapter.prototype.getItem = function(key) {
    var promise;
    promise = $.Deferred();
    this.store.get(key, function(storedValue) {
      return promise.resolve(storedValue);
    });
    return promise;
  };

  StickyStorageAdapter.prototype.removeItem = function(key) {
    var promise;
    promise = $.Deferred();
    this.store.remove(key, function() {
      return promise.resolve();
    });
    return promise;
  };

  return StickyStorageAdapter;

})();

Backbone.storageAdapters = {
  LocalStorageAdapter: LocalStorageAdapter,
  StickyStorageAdapter: StickyStorageAdapter
};


/*
Backbone dualStorage Adapter v1.3.0

A simple module to replace `Backbone.sync` with local storage based
persistence. Models are given GUIDS, and saved into a JSON object. Simple
as that.
 */

$ = Backbone.$;

Backbone.storageAdapter = new Backbone.storageAdapters.LocalStorageAdapter;

Backbone.storageAdapter.initialize();

Backbone.DualStorage = {
  offlineStatusCodes: [408, 502]
};

Backbone.Model.prototype.hasTempId = function() {
  return _.isString(this.id) && this.id.length === 36;
};

getStoreName = function(collection, model) {
  model || (model = collection.model.prototype);
  return _.result(collection, 'storeName') || _.result(model, 'storeName') || _.result(collection, 'url') || _.result(model, 'urlRoot') || _.result(model, 'url');
};

Backbone.Collection.prototype.syncDirty = function() {
  return Backbone.storageAdapter.getItem("" + (getStoreName(this)) + "_dirty").then((function(_this) {
    return function(store) {
      var id, ids, model, models;
      ids = (store && store.split(',')) || [];
      models = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = ids.length; _i < _len; _i++) {
          id = ids[_i];
          _results.push(this.get(id));
        }
        return _results;
      }).call(_this);
      return $.when.apply($, (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = models.length; _i < _len; _i++) {
          model = models[_i];
          if (model) {
            _results.push(model.save());
          }
        }
        return _results;
      })());
    };
  })(this));
};

Backbone.Collection.prototype.dirtyModels = function() {
  return Backbone.storageAdapter.getItem("" + (getStoreName(this)) + "_dirty").then((function(_this) {
    return function(store) {
      var id, ids, models;
      ids = (store && store.split(',')) || [];
      models = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = ids.length; _i < _len; _i++) {
          id = ids[_i];
          _results.push(this.get(id));
        }
        return _results;
      }).call(_this);
      return _.compact(models);
    };
  })(this));
};

Backbone.Collection.prototype.syncDestroyed = function() {
  return Backbone.storageAdapter.getItem("" + (getStoreName(this)) + "_destroyed").then((function(_this) {
    return function(store) {
      var id, ids, model, models;
      ids = (store && store.split(',')) || [];
      models = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = ids.length; _i < _len; _i++) {
          id = ids[_i];
          model = new this.model;
          model.set(model.idAttribute, id);
          model.collection = this;
          _results.push(model);
        }
        return _results;
      }).call(_this);
      return $.when.apply($, (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = models.length; _i < _len; _i++) {
          model = models[_i];
          _results.push(model.destroy());
        }
        return _results;
      })());
    };
  })(this));
};

Backbone.Collection.prototype.destroyedModelIds = function() {
  return Backbone.storageAdapter.getItem("" + (getStoreName(this)) + "_destroyed").then((function(_this) {
    return function(store) {
      var ids;
      return ids = (store && store.split(',')) || [];
    };
  })(this));
};

Backbone.Collection.prototype.syncDirtyAndDestroyed = function() {
  return this.syncDirty().then((function(_this) {
    return function() {
      return _this.syncDestroyed();
    };
  })(this));
};

S4 = function() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
};

window.Store = (function() {
  Store.prototype.sep = '';

  function Store(name) {
    this.name = name;
    this.dirtyName = "" + name + "_dirty";
    this.destroyedName = "" + name + "_destroyed";
    this.records = [];
  }

  Store.prototype.initialize = function() {
    return this.recordsOn(this.name).done((function(_this) {
      return function(result) {
        return _this.records = result || [];
      };
    })(this));
  };

  Store.prototype.generateId = function() {
    return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4();
  };

  Store.prototype.getStorageKey = function(model) {
    if (_.isObject(model)) {
      model = model.id;
    }
    return this.name + this.sep + model;
  };

  Store.prototype.save = function() {
    return Backbone.storageAdapter.setItem(this.name, this.records.join(','));
  };

  Store.prototype.recordsOn = function(key) {
    return Backbone.storageAdapter.getItem(key).then(function(store) {
      return (store && store.split(',')) || [];
    });
  };

  Store.prototype.dirty = function(model) {
    return this.recordsOn(this.dirtyName).then((function(_this) {
      return function(dirtyRecords) {
        if (!_.include(dirtyRecords, model.id.toString())) {
          dirtyRecords.push(model.id.toString());
          return Backbone.storageAdapter.setItem(_this.dirtyName, dirtyRecords.join(',')).then(function() {
            return model;
          });
        }
        return model;
      };
    })(this));
  };

  Store.prototype.clean = function(model, from) {
    var store;
    store = "" + this.name + "_" + from;
    return this.recordsOn(store).then((function(_this) {
      return function(dirtyRecords) {
        if (_.include(dirtyRecords, model.id.toString())) {
          return Backbone.storageAdapter.setItem(store, _.without(dirtyRecords, model.id.toString()).join(',')).then(function() {
            return model;
          });
        }
        return model;
      };
    })(this));
  };

  Store.prototype.destroyed = function(model) {
    return this.recordsOn(this.destroyedName).then((function(_this) {
      return function(destroyedRecords) {
        if (!_.include(destroyedRecords, model.id.toString())) {
          destroyedRecords.push(model.id.toString());
          Backbone.storageAdapter.setItem(_this.destroyedName, destroyedRecords.join(',')).then(function() {
            return model;
          });
        }
        return model;
      };
    })(this));
  };

  Store.prototype.create = function(model) {
    if (!_.isObject(model)) {
      return $.Deferred().resolve(model);
    }
    if (!model.id) {
      model.set(model.idAttribute, this.generateId());
    }
    return Backbone.storageAdapter.setItem(this.getStorageKey(model), JSON.stringify(model)).then((function(_this) {
      return function() {
        _this.records.push(model.id.toString());
        return _this.save().then(function() {
          return model;
        });
      };
    })(this));
  };

  Store.prototype.update = function(model) {
    return Backbone.storageAdapter.setItem(this.getStorageKey(model), JSON.stringify(model)).then((function(_this) {
      return function() {
        if (!_.include(_this.records, model.id.toString())) {
          _this.records.push(model.id.toString());
        }
        return _this.save().then(function() {
          return model;
        });
      };
    })(this));
  };

  Store.prototype.clear = function() {
    var id;
    return $.when.apply($, ((function() {
      var _i, _len, _ref, _results;
      _ref = this.records;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        id = _ref[_i];
        _results.push(Backbone.storageAdapter.removeItem(this.getStorageKey(id)));
      }
      return _results;
    }).call(this))).then((function(_this) {
      return function() {
        _this.records = [];
        return _this.save();
      };
    })(this));
  };

  Store.prototype.hasDirtyOrDestroyed = function() {
    return Backbone.storageAdapter.getItem(this.dirtyName).then((function(_this) {
      return function(dirty) {
        return Backbone.storageAdapter.getItem(_this.destroyedName).then(function(destroyed) {
          return !_.isEmpty(dirty) || !_.isEmpty(destroyed);
        });
      };
    })(this));
  };

  Store.prototype.find = function(model) {
    return Backbone.storageAdapter.getItem(this.getStorageKey(model)).then(function(modelAsJson) {
      if (modelAsJson === null) {
        return null;
      }
      return JSON.parse(modelAsJson);
    });
  };

  Store.prototype.findAll = function() {
    var id;
    return $.when.apply($, ((function() {
      var _i, _len, _ref, _results;
      _ref = this.records;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        id = _ref[_i];
        _results.push(Backbone.storageAdapter.getItem(this.getStorageKey(id)));
      }
      return _results;
    }).call(this))).then(function() {
      var model, models, _i, _len, _results;
      models = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      _results = [];
      for (_i = 0, _len = models.length; _i < _len; _i++) {
        model = models[_i];
        _results.push(JSON.parse(model));
      }
      return _results;
    });
  };

  Store.prototype.destroy = function(model) {
    return Backbone.storageAdapter.removeItem(this.getStorageKey(model)).then((function(_this) {
      return function() {
        _this.records = _.without(_this.records, model.id.toString());
        return _this.save().then(function() {
          return model;
        });
      };
    })(this));
  };

  Store.exists = function(storeName) {
    return Backbone.storageAdapter.getItem(storeName).then(function(value) {
      return value !== null;
    });
  };

  return Store;

})();

callbackTranslator = {
  needsTranslation: Backbone.VERSION === '0.9.10',
  forBackboneCaller: function(callback) {
    if (this.needsTranslation) {
      return function(model, resp, options) {
        return callback.call(null, resp);
      };
    } else {
      return callback;
    }
  },
  forDualstorageCaller: function(callback, model, options) {
    if (this.needsTranslation) {
      return function(resp) {
        return callback.call(null, model, resp, options);
      };
    } else {
      return callback;
    }
  }
};

localSync = function(method, model, options) {
  var isValidModel, store;
  isValidModel = (method === 'clear') || (method === 'hasDirtyOrDestroyed');
  isValidModel || (isValidModel = model instanceof Backbone.Model);
  isValidModel || (isValidModel = model instanceof Backbone.Collection);
  if (!isValidModel) {
    throw new Error('model parameter is required to be a backbone model or collection.');
  }
  store = new Store(options.storeName);
  return store.initialize().then((function(_this) {
    return function() {
      var promise;
      promise = (function() {
        switch (method) {
          case 'read':
            if (model instanceof Backbone.Model) {
              return store.find(model);
            } else {
              return store.findAll();
            }
            break;
          case 'hasDirtyOrDestroyed':
            return store.hasDirtyOrDestroyed();
          case 'clear':
            return store.clear();
          case 'create':
            return store.find(model).then(function(preExisting) {
              if (options.add && !options.merge && preExisting) {
                return preExisting;
              } else {
                return store.create(model).then(function(model) {
                  if (options.dirty) {
                    return store.dirty(model).then(function() {
                      return model;
                    });
                  }
                  return model;
                });
              }
            });
          case 'update':
            return store.update(model).then(function(model) {
              if (options.dirty) {
                return store.dirty(model);
              } else {
                return store.clean(model, 'dirty');
              }
            });
          case 'delete':
            return store.destroy(model).then(function() {
              if (options.dirty) {
                return store.destroyed(model);
              } else {
                if (model.id.toString().length === 36) {
                  return store.clean(model, 'dirty');
                } else {
                  return store.clean(model, 'destroyed');
                }
              }
            });
        }
      })();
      return promise.then(function(response) {
        if (response != null ? response.attributes : void 0) {
          response = response.attributes;
        }
        if (!options.ignoreCallbacks) {
          if (response) {
            options.success(response);
          } else {
            options.error('Record not found');
          }
        }
        return response;
      });
    };
  })(this));
};

parseRemoteResponse = function(object, response) {
  if (!(object && object.parseBeforeLocalSave)) {
    return response;
  }
  if (_.isFunction(object.parseBeforeLocalSave)) {
    return object.parseBeforeLocalSave(response);
  }
};

modelUpdatedWithResponse = function(model, response) {
  var modelClone;
  modelClone = new Backbone.Model;
  modelClone.idAttribute = model.idAttribute;
  modelClone.set(model.attributes);
  modelClone.set(model.parse(response));
  return modelClone;
};

backboneSync = Backbone.sync;

onlineSync = function(method, model, options) {
  options.success = callbackTranslator.forBackboneCaller(options.success);
  options.error = callbackTranslator.forBackboneCaller(options.error);
  return backboneSync(method, model, options);
};

dualSync = function(method, model, options) {
  var error, local, relayErrorCallback, storeExistsPromise, success, temporaryId;
  options.storeName = getStoreName(model.collection, model);
  options.success = callbackTranslator.forDualstorageCaller(options.success, model, options);
  options.error = callbackTranslator.forDualstorageCaller(options.error, model, options);
  if (_.result(model, 'remote') || _.result(model.collection, 'remote')) {
    return onlineSync(method, model, options);
  }
  local = _.result(model, 'local') || _.result(model.collection, 'local');
  options.dirty = options.remote === false && !local;
  if (options.remote === false || local) {
    return localSync(method, model, options);
  }
  options.ignoreCallbacks = true;
  success = options.success;
  error = options.error;
  storeExistsPromise = Store.exists(options.storeName);
  relayErrorCallback = function(response) {
    var offline, offlineStatusCodes, _ref;
    offlineStatusCodes = Backbone.DualStorage.offlineStatusCodes;
    if (_.isFunction(offlineStatusCodes)) {
      offlineStatusCodes = offlineStatusCodes(response);
    }
    offline = response.status === 0 || (_ref = response.status, __indexOf.call(offlineStatusCodes, _ref) >= 0);
    return storeExistsPromise.always(function(storeExists) {
      options.storeExists = storeExists;
      if (offline && storeExists) {
        options.dirty = true;
        return localSync(method, model, options).then(function(result) {
          return success(result);
        });
      } else {
        return error(response);
      }
    });
  };
  switch (method) {
    case 'read':
      return localSync('hasDirtyOrDestroyed', model, options).then(function(hasDirtyOrDestroyed) {
        if (hasDirtyOrDestroyed) {
          options.dirty = true;
          return success(localSync(method, model, options));
        } else {
          options.success = function(resp, status, xhr) {
            var clearIfNeeded, collection, idAttribute, responseModel;
            resp = parseRemoteResponse(model, resp);
            if (model instanceof Backbone.Collection) {
              collection = model;
              idAttribute = collection.model.prototype.idAttribute;
              clearIfNeeded = options.add ? $.Deferred().resolve() : localSync('clear', model, options);
              return clearIfNeeded.done(function() {
                var m, modelAttributes, models, responseModel, _i, _len;
                models = [];
                for (_i = 0, _len = resp.length; _i < _len; _i++) {
                  modelAttributes = resp[_i];
                  model = collection.get(modelAttributes[idAttribute]);
                  if (model) {
                    responseModel = modelUpdatedWithResponse(model, modelAttributes);
                  } else {
                    responseModel = new collection.model(modelAttributes);
                  }
                  models.push(responseModel);
                }
                return $.when.apply($, ((function() {
                  var _j, _len1, _results;
                  _results = [];
                  for (_j = 0, _len1 = models.length; _j < _len1; _j++) {
                    m = models[_j];
                    _results.push(localSync('update', m, options));
                  }
                  return _results;
                })())).then(function() {
                  return success(resp, status, xhr);
                });
              });
            } else {
              responseModel = modelUpdatedWithResponse(model, resp);
              return localSync('update', responseModel, options).then(function() {
                return success(resp, status, xhr);
              });
            }
          };
          options.error = function(resp) {
            return relayErrorCallback(resp);
          };
          return onlineSync(method, model, options);
        }
      });
    case 'create':
      options.success = function(resp, status, xhr) {
        var updatedModel;
        updatedModel = modelUpdatedWithResponse(model, resp);
        return localSync(method, updatedModel, options).then(function() {
          return success(resp, status, xhr);
        });
      };
      options.error = function(resp) {
        return relayErrorCallback(resp);
      };
      return onlineSync(method, model, options);
    case 'update':
      if (model.hasTempId()) {
        temporaryId = model.id;
        options.success = function(resp, status, xhr) {
          var updatedModel;
          updatedModel = modelUpdatedWithResponse(model, resp);
          model.set(model.idAttribute, temporaryId, {
            silent: true
          });
          return localSync('delete', model, options).then(function() {
            return localSync('create', updatedModel, options).then(function() {
              return success(resp, status, xhr);
            });
          });
        };
        options.error = function(resp) {
          model.set(model.idAttribute, temporaryId, {
            silent: true
          });
          return relayErrorCallback(resp);
        };
        model.set(model.idAttribute, null, {
          silent: true
        });
        return onlineSync('create', model, options);
      } else {
        options.success = function(resp, status, xhr) {
          var updatedModel;
          updatedModel = modelUpdatedWithResponse(model, resp);
          return localSync(method, updatedModel, options).then(function() {
            return success(resp, status, xhr);
          });
        };
        options.error = function(resp) {
          return relayErrorCallback(resp);
        };
        return onlineSync(method, model, options);
      }
      break;
    case 'delete':
      if (model.hasTempId()) {
        return localSync(method, model, options);
      } else {
        options.success = function(resp, status, xhr) {
          return localSync(method, model, options).then(function() {
            return success(resp, status, xhr);
          });
        };
        options.error = function(resp) {
          return relayErrorCallback(resp);
        };
        return onlineSync(method, model, options);
      }
  }
};

Backbone.sync = dualSync;

//# sourceMappingURL=backbone.dualstorage.map
