var uuid = require('node-uuid');

module.exports = function (_options) {
  var defaultStore = _options.defaultStore;
  var STATIC_STORE = {};

  // known stores
  var STORES = {
    static: function () {
      return STATIC_STORE;
    }
  };

  var SEARCH_CRITERIA = {
    objectCriteria: function (criteria) {
      var parts = [];
      for (var name in criteria) {
        if (criteria.hasOwnProperty(name)) {
          parts.push([name.split('.'), criteria[name]]);
        }
      }

      return function (item) {
        for (var i = 0; i < parts.length; i++) {
          var part = parts[i];
          var value = deepValue(item, part[0]);
          var comparator = part[1];
          if (typeof comparator === 'function') {
            if (!comparator(value, item)) {
              return false;
            }
          } else if (value !== comparator) {
            return false;
          }
        }
        return true;
      };
    },

    allCriteria: function () {
      return true;
    }
  };

  var DOMAIN_OPTIONS = {};
  var DEFAULT_OPTIONS = {
    idAttr: ['id'],
    store: defaultStore,
    joins: []
  };


  function options (domain) {
    return DOMAIN_OPTIONS[domain] || DEFAULT_OPTIONS;
  }

  function _index(domain, store, graceful) {
    if (!store || !store.__meta || !store.__meta[domain]) {
      return undefined;
    }
    return store.__meta[domain].index;
  }

  function _meta(domain, store) {
    return store.__meta[domain].data;
  }

  function _init (domain, store, override) {
    store[domain] = store[domain] || [];
    store.__meta = store.__meta || {};
    store.__meta[domain] = override ? {} : (store.__meta[domain] || {});
    store.__meta[domain].index = store.__meta[domain].index || {};
    store.__meta[domain].data = store.__meta[domain].data || {};
    store[domain] = store[domain] || [];
    return store[domain];
  }

  /**
   * options:
   * - store: "static" or undefined (for default store) or a function which returns the store Object
   * - idAttr: the attribute key used to pluck the Object's id (or "id" if undefined)
   * - join: foreign key join that should be patched into this domain object when returning results
   *     {
   *       _foreign key id path_: {
   *         removeId: true/false (default is false)
   *         path: _path where foreign object should be set_,
   *         domain: the fk domain
   *       }
   *     }
   */
  function init (domain, results, options) {
    if (!Array.isArray(results) && results && !options) {
      options = results;
      results = undefined;
    }
    options = options || {};
    options.joins = prepareJoinOptions(options.join);

    var domainOptions = DOMAIN_OPTIONS[domain] = Object.assign({}, options);
    if (!domainOptions.store) {
      domainOptions.store = defaultStore;
    }
    if (typeof options.store === 'string') {
      domainOptions.store = STORES[options.store];
      if (!domainOptions.store) {
        throw new Error('invalid store type "' + options.store + '"');
      }
    }
    if (!domainOptions.store) {
      throw new Error('invalid store "' + options.store + '"');
    }
    domainOptions.idAttr = (domainOptions.idAttr || 'id').split('.');

    var store = domainOptions.store();
    _init(domain, store, !results);
    if (results) {
      store[domain] = results;
      var index = _index(domain, store);
      results.forEach(function (item) {
        var id = deepValue(item, domainOptions.idAttr);
        index[id] = item;
      });
    }
  }

  function clear (domain) {
    validateDomain(domain);

    var store = options(domain).store();
    if (store[domain]) {
      delete store[domain];
    }
    if (store.__meta && store.__meta[domain]) {
      delete store.__meta[domain];
    }
  }

  function list (domain) {
    validateDomain(domain);

    return new ListResult(domain, options(domain).store()[domain]);
  }

  function insertOrUpdate (domain, item) {
    validateDomain(domain);
    validateItem(item);

    var _options = options(domain);
    var store = _options.store();
    var results = _init(domain, store);
    var id = deepValue(item, domainOptions.idAttr);

    if (!get(domain, id)) {
      insert(domain, item);
    } else {
      update(domain, item);
    }
  }

  function insert (domain, item) {
    validateDomain(domain);
    validateItem(item);

    var _options = options(domain);
    var store = _options.store();
    var results = _init(domain, store);
    var id = deepValue(item, _options.idAttr);

    if (!id) {
      id = uuid.v4();
      immutableSet(item, domainOptions.idAttr, id);
    }

    var index = _index(domain, store);
    if (index[id]) {
      throw new Error('Duplicate entry for ' + domain + ':' + id);
    }
    index[id] = item;
    results.push(item);

    return item;
  }

  function update (domain, id, item) {
    validateDomain(domain);

    var overwrite = false;
    if (!item) {
      overwrite = true;
      item = id;
      id = undefined;
    }
    validateItem(item);

    var _options = options(domain);
    var store = _options.store();
    _init(domain, store);

    id = id || deepValue(item, _options.idAttr);
    if (!id) {
      throw new Error('item to update does not have an id');
    }

    var index = _index(domain, store);
    var _item = index[id];
    if (_item) {
      if (overwrite) {
        immutableSet(item, _options.idAttr, id);
        index[id] = item;
        var items = store[domain];
        for (var i = 0; i < items.length; i++) {
          if (deepValue(items[i], _options.idAttr) === id) {
            items.splice(i, 1, item);
            return item;
          }
        }
      } else {
        Object.assign(_item, item);
        return _item;
      }
    } else {
      throw new Error('item does not exist ' + domain + ':' + id);
    }
  }

  function _delete (domain, idOrItem) {
    var _options = options(domain);
    var store = _options.store();
    var results = store[domain];
    var id;
    if (typeof idOrItem === 'object') {
      id = deepValue(idOrItem, _options.idAttr);
    } else {
      id = idOrItem;
    }
    if (!results) {
      throw new Error('item does not exist ' + domain + ':' + id);
    }

    var index = _index(domain, store);
    var item = index[id];
    if (!item) {
      throw new Error('item does not exist ' + domain + ':' + id);
    }
    delete index[id];
    var meta = _meta(domain, store);
    delete meta[id];

    for (var i = 0; i < results.length; i++) {
      var result = results[i];
      if (deepValue(result, _options.idAttr) === id) {
        results.splice(i, 1);
        return result;
      }
    }
  }

  function get (domain, id) {
    validateDomain(domain);
    validateId(id);

    var _options = options(domain);
    var store = _options.store(domain);
    var index = _index(domain, store, true);
    var rtn = index && index[id];
    if (_options.joins.length === 0) {
      return rtn;
    } else {
      return prepareData(rtn, _options.joins);
    }
  }

  function meta (domain, id, value, replace) {
    validateDomain(domain);
    validateId(id);

    var item = get(domain, id);
    if (!item && value) {
      throw new Error('item does not exist ' + domain + ':' + id);
    }
    var store = options(domain).store();
    var __meta = _meta(domain, store);
    if (value === false) {
      delete __meta[id];
      return;
    } else if (typeof value === 'undefined') {
      return __meta[id];
    } else {
      __meta[id] = value;
    }
  }

  function prepareData (item, joins) {
    if (joins.length === 0) {
      return item;
    }

    // handle top level joins
    item = Object.assign({}, item);
    var nested = false;
    joins.forEach(function (join) {
      var id = deepValue(item, join.idPath);
      if (join.removeId) {
        immutableSet(item, join.idPath, undefined);
      }
      if (id) {
        var fValue = get(join.domain, id);
        if (fValue) {
          immutableSet(item, join.objectPath, fValue);
        }
      }
    });
    return item;
  }


  function ListResult (domain, value, options, data) {
    this.domain = domain;
    this._value = value || [];
    this._data = data || {};
    this._data.totalCount = this._data.totalCount || this._value.length;
    this.options = options || {};
  }
  Object.assign(ListResult.prototype, {
    filter: function (criteria) {
      this._data.filtered = true;
      if (typeof criteria === 'object') {
        criteria = SEARCH_CRITERIA.objectCriteria(criteria);
      } else if (!criteria) {
        criteria = SEARCH_CRITERIA.allCriteria;
      }
      var results = [];
      for (var i = 0; i < this._value.length; i++) {
        var item = this._value[i];
        if (criteria(item, i)) {
          results.push(item);
        }
      }
      return new ListResult(this.domain, results, this.options, this._data);
    },

    sort: function (comparator, ascending) {
      if (typeof comparator === 'string') {
        // comparator is actually a field name
        comparator = fieldSortComparator(comparator, typeof ascending === 'undefined' ? true : !!ascending);
      }
      var results = this._value.slice(0);
      results.sort(comparator);
      this._data.sorted = true;
      return new ListResult(this.domain, results, this.options, this._data);
    },

    limit: function (offset, size) {
      this._data.totalCount = this._value.length;
      this._data.offset = offset;
      this._data.maxSize = size;
      return new ListResult(this.domain, this._value.slice(offset, size ? offset + size : undefined), this.options, this._data);
    },

    result: function () {
      var _options = options(this.domain);
      var joins = _options.joins;
      if (joins.length === 0) {
        return this._value;
      } else {
        return this._value.map(function (item) {
          return prepareData(item, _options.joins);
        });
      }
    },

    data: function () {
      return Object.assign({
        result: this.result()
      }, this._data);
    }
  });

  return {
    // remove all entities for the domain
    clear: clear,
    // return all results for a domain which can be filtered
    list: list,
    // return a single domain item
    get: get,
    // insert a new domain item
    insert: insert,
    // update a new domain item
    update: update,
    // insert or update a new domain item
    insertOrUpdate: insertOrUpdate,
    // delete an existing domain item
    delete: _delete,
    // update domain meta data
    meta: meta,
    // initialize domain data
    init: init
  };
};

// not truly because we know we don't have to update the parent
function immutableSet (object, pathParts, value) {
  var parent = object;
  for (var i = 0; i < pathParts.length - 1; i++) {
    var _value = parent[pathParts[i]];
    if (_value === undefined) {
      _value = {};
    }
    if (typeof _value !== 'object') {
      throw new Error('invalid object value for: ' + pathParts.join('.'));
    }
    _value = Object.assign({}, _value);
    parent[pathParts[i]] = _value;
    parent = _value;
  }
  if (typeof value === 'undefined') {
    delete parent[pathParts[pathParts.length - 1]];
  } else {
    parent[pathParts[pathParts.length - 1]] = value;
  }
}

function fieldSortComparator (fieldName, ascending) {
  var parts = fieldName.split('.');

  return function (a, b) {
    var aValue = deepValue(a, parts);
    var bValue = deepValue(b, parts);
    if (aValue > bValue) return ascending ? 1 : -1;
    if (aValue < bValue) return ascending ? -1 : 1;
    return 0;
  };
}

function deepValue (parent, pathParts) {
  for (var i = 0; i < pathParts.length && parent; i++) {
    parent = parent[pathParts[i]];
  }
  return parent;
}

function validateId (id) {
  if (typeof id === 'undefined') {
    throw new Error('invalid id ' + id);
  }
}

function validateDomain (domain) {
  if (!domain || typeof domain !== 'string') {
    throw new Error('invalid domain ' + domain);
  }
}

function validateItem (item) {
  if (!item) {
    throw new Error('missing item');
  }
}

function prepareJoinOptions (data) {
  var rtn = [];
  for (var key in data) {
    if (data.hasOwnProperty(key)) {
      var value = data[key];
      var objectPath = value.path;
      var removeId = value.removeId;
      var domain = value.domain;
      rtn.push({
        idPath: key.split('.'),
        objectPath: objectPath.split('.'),
        domain: domain,
        removeId: removeId
      });
    }
  }
  return rtn;
}
