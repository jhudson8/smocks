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
    idAttr: 'id',
    store: defaultStore
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

  function init (domain, results, options) {
    if (!Array.isArray(results) && results && !options) {
      options = results;
      results = undefined;
    }
    options = options || {};

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
    domainOptions.idAttr = domainOptions.idAttr || 'id';

    var store = domainOptions.store();
    _init(domain, store, !results);
    if (results) {
      store[domain] = results;
      var index = _index(domain, store);
      results.forEach(function (item) {
        index[item[domainOptions.idAttr]] = item;
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

    return new ListResult(options(domain).store()[domain]);
  }

  function insertOrUpdate (domain, item) {
    validateDomain(domain);
    validateItem(item);

    var _options = options(domain);
    var store = _options.store();
    var results = _init(domain, store);
    var id = item[_options.idAttr];

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
    var id = item[_options.idAttr];

    if (!id) {
      id = item[_options.idAttr] = uuid.v4();
    }

    var index = _index(domain, store);
    if (index[id]) {
      throw new Error('Duplicate entry for ' + domain + ':' + id);
    }
    index[id] = item;
    results.push(item);

    return item;
  }

  function update (domain, id, item, overwrite) {
    validateDomain(domain);
    if (!item || item === true) {
      overwrite = item;
      item = id;
      id = undefined;
    }
    validateItem(item);

    var _options = options(domain);
    var store = _options.store();
    _init(domain, store);

    id = id || item[_options.idAttr];
    if (!id) {
      throw new Error('item to update does not have an id');
    }

    var index = _index(domain, store);
    var _item = index[id];
    if (_item) {
      if (overwrite) {
        item[_options.idAttr] = id;
        index[id] = item;
        var items = store[domain];
        for (var i = 0; i < items.length; i++) {
          if (items[i][_options.idAttr] === id) {
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
      id = idOrItem[_options.idAttr];
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
      if (result[_options.idAttr] === id) {
        results.splice(i, 1);
        return result;
      }
    }
  }

  function get (domain, id) {
    validateDomain(domain);
    validateId(id);

    var store = options(domain).store(domain);
    var index = _index(domain, store, true);
    return index && index[id];
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


  function ListResult (value) {
    this.value = value || [];
  }
  Object.assign(ListResult.prototype, {
    filter: function (criteria) {
      if (typeof criteria === 'object') {
        criteria = SEARCH_CRITERIA.objectCriteria(criteria);
      } else if (!criteria) {
        criteria = SEARCH_CRITERIA.allCriteria;
      }
      var results = [];
      for (var i = 0; i < this.value.length; i++) {
        var item = this.value[i];
        if (criteria(item, i)) {
          results.push(item);
        }
      }
      return new ListResult(results);
    },

    sort: function (comparator) {
      var results = this.value.slice(0);
      results.sort(comparator);
      return new ListResult(results);
    },

    limit: function (offset, size) {
      return new ListResult(this.value.slice(offset, size ? offset + size : undefined));
    },

    result: function () {
      return this.value;
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
