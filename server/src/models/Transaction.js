const { Transaction, TransactionModel } = require('../db');

const TransactionExport = function(data) {
  return Transaction(data);
};
Object.assign(TransactionExport, TransactionModel);

module.exports = TransactionExport;
