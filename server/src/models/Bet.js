const { Bet, BetModel } = require('../db');

const BetExport = function(data) {
  return Bet(data);
};
Object.assign(BetExport, BetModel);

module.exports = BetExport;
