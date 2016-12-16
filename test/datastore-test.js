var expect = require('chai').expect;

var DEFAULT_STORE = {};
var db = require('../lib/datastore')({
  defaultStore: function () {
    return DEFAULT_STORE;
  }
});

function insertItems(domain, numItems, _db, nesting) {
  _db = _db || db;
  for (var i = 0; i < numItems; i++) {
    var j = i + 1;
    var toInsert = { id: j + '', val: j };
    if (nesting) {
      toInsert.nested = { value: j + 1 };
    }
    _db.insert(domain, toInsert);
  }
}

describe('datastore', function () {
  beforeEach(function () {
    db.init('test', { store: 'static' });
    DEFAULT_STORE = {};
  });
  afterEach(function () {
    db.clear('test');
  });

  describe('join', function () {
    beforeEach(function () {
      db.init('fktest', [], {
        join: {
          fk1: {
            path: 'fkObject',
            domain: 'fkdomain'
          },
          'nested.fk2': {
            path: 'nested2.fkObject',
            domain: 'fkdomain',
            removeId: true
          }
        }
      });
    });

    it('should not fail if the foreign object does not exist', function () {
      db.insert('fktest', { id: '1', fk1: '1' });
      expect(db.get('fktest', '1')).to.equal({ id: '1', fk1: '1' });
    });
    it('should remove id even if foreign object does not exist', function () {
      db.insert('fktest', { id: '1', fk1: '1', nested: { fk2: '2' } });
      expect(db.get('fktest', '1')).to.deep.equal({ id: '1', fk1: '1', nested: {} });
    });
    it('should include foreign key objects', function () {
      db.insert('fktest', { id: '1', fk1: '1', nested: { fk2: '2' } });
      db.insert('fkdomain', { id: '1', abc: 'def' });
      db.insert('fkdomain', { id: '2', ghi: 'jkl' });
      expect(db.get('fktest', '1')).to.deep.equal({
        id: '1',
        fk1: '1',
        fkObject: {
          id: '1',
          abc: 'def'
        },
        nested: {},
        nested2: {
          fkObject: {
            id: '2',
            ghi: 'jkl'
          }
        }
      });
    });
  });

  describe('list', function () {
    it('should initialize with empty list', function () {
      expect(db.list('test').result().length).to.equal(0);
    });
    it('should return inserted items', function () {
      insertItems('test', 1);
      var val = db.list('test').result();
      expect(val).to.deep.equal([{ id: '1', val: 1 }]);
    });
    it('should return paged items', function () {
      insertItems('test', 10);
      var val = db.list('test').result();
      expect(val[9]).to.deep.equal({ id: '10', val: 10 });
      var paged = db.list('test').limit(1, 3).result();
      expect(paged.length).to.equal(3);
      expect(paged).to.deep.equal([
        { id: '2', val: 2 },
        { id: '3', val: 3 },
        { id: '4', val: 4 }
      ]);
    });

    describe('filtering', function () {
      it('should filter using a top level function', function () {
        insertItems('test', 10);
        var filtered = db.list('test').filter(function (item) { return item.val === 5; }).result();
        expect(filtered).to.deep.equal([{ id: '5', val: 5 }]);
      });
      it('should filter using equality', function () {
        insertItems('test', 10);
        var filtered = db.list('test').filter({ val: 5 }).result();
        expect(filtered).to.deep.equal([{ id: '5', val: 5 }]);
      });
      it('should filter using multiple attributes', function () {
        insertItems('test', 10);
        var filtered = db.list('test').filter({ id: '6', val: 5 }).result();
        expect(filtered.length).to.equal(0);
        filtered = db.list('test').filter({ id: '5', val: 5 }).result();
        expect(filtered).to.deep.equal([{ id: '5', val: 5 }]);
      });
      it('should filter using attributes and functions', function () {
        insertItems('test', 10);
        var filtered = db.list('test').filter({ id: '6', val: function (val) { return val === 5; } }).result();
        expect(filtered.length).to.equal(0);
        filtered = db.list('test').filter({ id: '5', val: function (val) { return val === 5; } }).result();
        expect(filtered).to.deep.equal([{ id: '5', val: 5 }]);
      });
      it('should filter using nested values', function () {
        insertItems('test', 10, db, true);
        var filtered = db.list('test').filter({ 'nested.value': 6 }).result();
        expect(filtered).to.deep.equal([{ id: '5', val: 5, nested: { value: 6} }]);
      });
    });

    describe('sorting', function () {
      it('should sort', function () {
        insertItems('test', 3);
        var sorted = db.list('test').sort(function (a, b) {
          return b.val - a.val;
        }).result();
        expect(sorted).to.deep.equal([
          { id: '3', val: 3 },
          { id: '2', val: 2 },
          { id: '1', val: 1 }
        ]);
      });
      it('should sort using a field name', function () {
        insertItems('test', 3);
        var sorted = db.list('test').sort('val', false).result();
        expect(sorted).to.deep.equal([
          { id: '3', val: 3 },
          { id: '2', val: 2 },
          { id: '1', val: 1 }
        ]);
        sorted = db.list('test').sort('val', true).result();
        expect(sorted).to.deep.equal([
          { id: '1', val: 1 },
          { id: '2', val: 2 },
          { id: '3', val: 3 }
        ]);
        sorted = db.list('test').sort('val').result();
        expect(sorted).to.deep.equal([
          { id: '1', val: 1 },
          { id: '2', val: 2 },
          { id: '3', val: 3 }
        ]);
      });
    });

    it('should do all things', function () {
      insertItems('test', 20);
      var result = db.list('test').filter({ val: function(val) { return val < 15; } }).sort(function (a, b) {
        return b.val - a.val;
      }).limit(1, 5).result();
      expect(result).to.deep.equal([
        { id: '13', val: 13 },
        { id: '12', val: 12 },
        { id: '11', val: 11 },
        { id: '10', val: 10 },
        { id: '9', val: 9 }
      ]);
    });

    it('should do all things and provide associated data', function () {
      insertItems('test', 20);
      var data = db.list('test').filter({ val: function(val) { return val < 15; } }).sort(function (a, b) {
        return b.val - a.val;
      }).limit(1, 5).data();
      expect(data.result).to.deep.equal([
        { id: '13', val: 13 },
        { id: '12', val: 12 },
        { id: '11', val: 11 },
        { id: '10', val: 10 },
        { id: '9', val: 9 }
      ]);
      expect(data.totalCount).to.equal(14);
      expect(data.filtered).to.equal(true);
      expect(data.sorted).to.equal(true);
      expect(data.offset).to.equal(1);
      expect(data.maxSize).to.equal(5);
    });
  });

  describe('get', function () {
    it('should not fail if the domain has not been initialized', function () {
      expect(db.get('nope', '1')).to.equal(undefined);
    });
    it('should return undefined with an initialized domain but no existing item', function () {
      expect(db.get('test', '1')).to.equal(undefined);
    });
    it('should return an inserted item', function () {
      insertItems('test', 1);
      expect(db.get('test', '1')).to.deep.equal({ id: '1', val: 1 });
    });
    it('should not return a deleted item', function () {
      insertItems('test', 1);
      var deleted = db.delete('test', '1');
      expect(!!deleted).to.equal(true);
      expect(db.get('test', '1')).to.equal(undefined);
    });
  });

  describe('insert', function () {
    it('should insert a value', function () {
      insertItems('test', 1);
      expect(db.list('test').result()).to.deep.equal([{ id: '1', val: 1 }]);
    });
    it('should obey idAttr', function () {
      db.init('custom', { idAttr: 'foo' });
      db.insert('custom', { foo: '1' });
      expect(db.get('custom', '1')).to.deep.equal({ foo: '1' });
    });
    it('should throw an error if a duplicate value has been inserted', function () {
      insertItems('test', 1);
      var err;
      try {
        db.insert('test', { id: '1' });
      } catch (e) {
        err = e;
      }
      expect(err.message).to.equal('Duplicate entry for test:1');
    });
  });

  describe('update', function () {
    it('should update parts of an item and return the updated item using an id', function () {
      db.insert('test', { id: '1', foo: 'bar', abc: 'def' });
      var updated = db.update('test', '1', { abc: 'ghi' });
      expect(updated).to.deep.equal({ id: '1', foo: 'bar', abc: 'ghi' });
    });
    it('should update parts of an item and return the updated item using a derived id from the item', function () {
      db.insert('test', { id: '1', foo: 'bar', abc: 'def' });
      var updated = db.update('test', { id: '1', abc: 'ghi' });
      expect(updated).to.deep.equal({ id: '1', foo: 'bar', abc: 'ghi' });
    });
    it('should completely update a value with embedded id', function () {
      insertItems('test', 2);
      var toUpdate = { id: '2', abc: 'ghi' };
      var updated = db.update('test', toUpdate, true);
      expect(updated).to.equal(toUpdate);
      expect(updated).to.deep.equal({ id: '2', abc: 'ghi' });
      expect(db.get('test', '2')).to.equal(toUpdate);
      expect(db.list('test').result()).to.deep.equal([
        { id: '1', val: 1 },
        { id: '2', abc: 'ghi' }
      ]);
    });
    it('should completely update a value with separate id', function () {
      insertItems('test', 2);
      var toUpdate = { abc: 'ghi' };
      var updated = db.update('test', '2', toUpdate, true);
      expect(updated).to.equal(toUpdate);
      expect(updated).to.deep.equal({ id: '2', abc: 'ghi' });
      expect(db.get('test', '2')).to.equal(toUpdate);
      expect(db.list('test').result()).to.deep.equal([
        { id: '1', val: 1 },
        { id: '2', abc: 'ghi' }
      ]);
    });
    it('should throw an error if the item does not exist', function () {
      var err;
      try {
        db.update('test', '1', {abc: 'def'});
      } catch (e) {
        err = e;
      }
      expect(err.message).to.equal('item does not exist test:1');
    });
  });

  describe('delete', function () {
    it('should delete an existing item and return the deleted item', function () {
      insertItems('test', 1);
      var deleted = db.delete('test', '1');
      expect(deleted).to.deep.equal({ id: '1', val: 1 });
      expect(db.list('test').result()).to.deep.equal([]);
    });
    it('should throw an error if the item to delete does not exist', function () {
      var err;
      try {
        db.delete('test', '1');
      } catch (e) {
        err = e;
      }
      expect(err.message).to.equal('item does not exist test:1');
    });
  });

  describe('meta', function () {
    it('should return undefined for an item that does not exist', function () {
      expect(db.meta('test', '1')).to.equal(undefined);
    });
    it('should set metadata for an item that does exist', function () {
      insertItems('test', 1);
      db.meta('test', '1', { foo: 'bar' });
      expect(db.meta('test', '1')).to.deep.equal({ foo: 'bar' });
    });
    it('should delete metadata after an item has been deleted', function () {
      insertItems('test', 1);
      db.meta('test', '1', { foo: 'bar' });
      db.delete('test', '1');
      expect(db.meta('test', '1')).to.equal(undefined);
    });
  });
});
