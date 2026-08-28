const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(DATA_DIR, 'db.json');

// In-memory store
let dbState = {
  users: [],
  gamerounds: [],
  bets: [],
  transactions: [],
  sitesettings: []
};

// Load from disk
function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      dbState = JSON.parse(raw);
    } else {
      saveDb();
    }
  } catch (e) {
    console.error('Error loading db.json:', e);
  }
}

// Save to disk
function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving db.json:', e);
  }
}

loadDb();

function generateId() {
  return crypto.randomBytes(12).toString('hex');
}

// Model base class
class MemoryModel {
  constructor(collectionName, data = {}) {
    this._collection = collectionName;
    Object.assign(this, data);
    if (!this._id) {
      this._id = generateId();
    }
    if (!this.createdAt) {
      this.createdAt = new Date().toISOString();
    }
  }

  async save() {
    loadDb();
    const list = dbState[this._collection];
    const index = list.findIndex(item => item._id === this._id);
    const plain = { ...this };
    delete plain._collection;

    if (index !== -1) {
      list[index] = plain;
    } else {
      list.push(plain);
    }
    saveDb();
    return this;
  }
}

function matchesQuery(item, query = {}) {
  if (!query || Object.keys(query).length === 0) return true;

  if (query.$or && Array.isArray(query.$or)) {
    return query.$or.some(subQuery => matchesQuery(item, subQuery));
  }

  for (const [key, val] of Object.entries(query)) {
    if (key === '$or') continue;

    if (val && typeof val === 'object' && val.$ne !== undefined) {
      if (item[key] === val.$ne) return false;
      continue;
    }

    if (val && typeof val === 'object' && val.$regex !== undefined) {
      const reg = new RegExp(val.$regex, val.$options || '');
      if (!reg.test(item[key] || '')) return false;
      continue;
    }

    if (item[key] !== val) {
      return false;
    }
  }
  return true;
}

// Query helper for chaining .sort().skip().limit().select().populate()
class QueryChain {
  constructor(collection, results, single = false) {
    this._collection = collection;
    this._results = results ? [...results] : [];
    this._single = single;
  }

  sort(sortObj = {}) {
    for (const [field, dir] of Object.entries(sortObj)) {
      this._results.sort((a, b) => {
        if (a[field] > b[field]) return (dir === 1 || dir === 'asc') ? 1 : -1;
        if (a[field] < b[field]) return (dir === 1 || dir === 'asc') ? -1 : 1;
        return 0;
      });
    }
    return this;
  }

  skip(n = 0) {
    this._results = this._results.slice(n);
    return this;
  }

  limit(n = 100) {
    this._results = this._results.slice(0, n);
    return this;
  }

  select(fieldsStr = '') {
    return this;
  }

  populate(field, selectStr) {
    loadDb();
    if (field === 'userId') {
      this._results = this._results.map(item => {
        const u = dbState.users.find(u => u._id === item.userId || u._id === item.userId?._id);
        return {
          ...item,
          userId: u ? { _id: u._id, username: u.username, idNumber: u.idNumber, firstName: u.firstName, lastName: u.lastName, email: u.email, role: u.role } : null
        };
      });
    }
    return this;
  }

  then(resolve, reject) {
    try {
      if (this._single) {
        const item = this._results[0] || null;
        resolve(item ? createModelInstance(this._collection, item) : null);
      } else {
        const instances = this._results.map(item => createModelInstance(this._collection, item));
        resolve(instances);
      }
    } catch (e) {
      if (reject) reject(e);
      else throw e;
    }
  }

  async exec() {
    return new Promise((resolve, reject) => this.then(resolve, reject));
  }
}

function createModelInstance(collectionName, data) {
  if (!data) return null;
  const instance = new MemoryModel(collectionName, data);

  if (collectionName === 'users') {
    instance.isCurrentlyBanned = function() {
      // Admins are unbannable
      if (this.role === 'admin' || this.username === 'Noman') return false;
      if (!this.isBanned) return false;
      if (this.banUntil && new Date() > new Date(this.banUntil)) {
        return false;
      }
      return true;
    };
  }

  return instance;
}

function createCollectionWrapper(collectionName) {
  return {
    find(query = {}) {
      loadDb();
      const matched = dbState[collectionName].filter(item => matchesQuery(item, query));
      return new QueryChain(collectionName, matched, false);
    },

    findOne(query = {}) {
      loadDb();
      const matched = dbState[collectionName].filter(item => matchesQuery(item, query));
      return new QueryChain(collectionName, matched, true);
    },

    findById(id) {
      loadDb();
      const matched = dbState[collectionName].filter(item => item._id === id?.toString() || item._id === id);
      return new QueryChain(collectionName, matched, true);
    },

    async findByIdAndUpdate(id, update = {}, options = {}) {
      loadDb();
      const list = dbState[collectionName];
      const index = list.findIndex(item => item._id === id?.toString() || item._id === id);
      if (index === -1) return null;

      let item = { ...list[index] };

      if (update.$inc) {
        for (const [k, v] of Object.entries(update.$inc)) {
          item[k] = (item[k] || 0) + v;
        }
      }
      if (update.$set) {
        Object.assign(item, update.$set);
      }
      if (update.$push) {
        for (const [k, v] of Object.entries(update.$push)) {
          if (!Array.isArray(item[k])) item[k] = [];
          if (!v._id) v._id = generateId();
          item[k].push(v);
        }
      }

      // Direct properties
      for (const [k, v] of Object.entries(update)) {
        if (!k.startsWith('$')) {
          item[k] = v;
        }
      }

      list[index] = item;
      saveDb();
      return createModelInstance(collectionName, item);
    },

    async updateOne(query = {}, update = {}) {
      loadDb();
      const list = dbState[collectionName];
      const index = list.findIndex(item => matchesQuery(item, query));
      if (index === -1) return { matchedCount: 0, modifiedCount: 0 };

      let item = { ...list[index] };
      if (update.$set) {
        Object.assign(item, update.$set);
      }
      for (const [k, v] of Object.entries(update)) {
        if (!k.startsWith('$')) {
          item[k] = v;
        }
      }
      list[index] = item;
      saveDb();
      return { matchedCount: 1, modifiedCount: 1 };
    },

    async countDocuments(query = {}) {
      loadDb();
      return dbState[collectionName].filter(item => matchesQuery(item, query)).length;
    },

    async create(data) {
      loadDb();
      const item = { ...data };
      if (!item._id) item._id = generateId();
      if (!item.createdAt) item.createdAt = new Date().toISOString();

      if (collectionName === 'users' && !item.idNumber) {
        let maxSeq = 0;
        for (const u of dbState.users) {
          if (u.idNumber && String(u.idNumber).startsWith('97891')) {
            const seq = parseInt(String(u.idNumber).slice(5), 10);
            if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
          }
        }
        item.idNumber = `97891${String(maxSeq + 1).padStart(3, '0')}`;
      }

      dbState[collectionName].push(item);
      saveDb();
      return createModelInstance(collectionName, item);
    },

    async aggregate(pipeline = []) {
      loadDb();
      let results = [...dbState[collectionName]];
      for (const stage of pipeline) {
        if (stage.$match) {
          results = results.filter(item => matchesQuery(item, stage.$match));
        }
        if (stage.$group) {
          const sumField = stage.$group.total?.$sum?.replace('$', '');
          if (sumField) {
            const sum = results.reduce((acc, curr) => acc + (curr[sumField] || 0), 0);
            return [{ _id: null, total: sum }];
          }
        }
      }
      return results;
    },

    // Static helper for SiteSettings
    async getSingleton() {
      loadDb();
      if (dbState.sitesettings.length === 0) {
        const defaultSettings = {
          _id: generateId(),
          siteName: '1play',
          siteTagline: 'Your Ultimate Aviator Crash Casino',
          siteLogo: '/logo-1play.png',
          favicon: '/logo-1play.png',
          themeColors: {
            background: '#090306',
            headerBg: 'rgba(18, 6, 12, 0.96)',
            primary: '#ef4444',
            secondary: 'rgba(239, 68, 68, 0.15)',
            betButton: '#10b981',
            cashoutButton: '#ef4444',
            depositButton: '#10b981',
            withdrawButton: '#ef4444',
            cardBg: 'rgba(24, 8, 16, 0.72)',
            text: '#ffffff'
          },
          depositMethods: {
            easypaisa: { enabled: true, accountNumber: '03001234567', accountTitle: '1play Official', qrCode: '', instructions: 'Transfer to EasyPaisa and submit TID' },
            jazzcash: { enabled: true, accountNumber: '03019876543', accountTitle: '1play Official', qrCode: '', instructions: 'Transfer to JazzCash and submit TID' },
            bank: { enabled: true, bankName: 'Meezan Bank', accountNumber: '01020304050607', accountTitle: '1play Official', qrCode: '', instructions: 'Transfer to Bank and submit receipt' }
          },
          minDeposit: 100,
          maxDeposit: 100000,
          minWithdraw: 200,
          maxWithdraw: 50000,
          maintenanceMode: false
        };
        dbState.sitesettings.push(defaultSettings);
        saveDb();
      }
      return createModelInstance('sitesettings', dbState.sitesettings[0]);
    }
  };
}

module.exports = {
  User: function(data) {
    const inst = createModelInstance('users', data);
    if (!inst.idNumber) {
      let maxSeq = 0;
      for (const u of dbState.users) {
        if (u.idNumber && String(u.idNumber).startsWith('97891')) {
          const seq = parseInt(String(u.idNumber).slice(5), 10);
          if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
        }
      }
      inst.idNumber = `97891${String(maxSeq + 1).padStart(3, '0')}`;
    }
    return inst;
  },
  UserModel: createCollectionWrapper('users'),
  GameRound: function(data) { return createModelInstance('gamerounds', data); },
  GameRoundModel: createCollectionWrapper('gamerounds'),
  Bet: function(data) { return createModelInstance('bets', data); },
  BetModel: createCollectionWrapper('bets'),
  Transaction: function(data) { return createModelInstance('transactions', data); },
  TransactionModel: createCollectionWrapper('transactions'),
  SiteSettings: function(data) { return createModelInstance('sitesettings', data); },
  SiteSettingsModel: createCollectionWrapper('sitesettings'),
  saveDb,
  loadDb
};
