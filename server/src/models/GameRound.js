const { GameRound, GameRoundModel } = require('../db');

const GameRoundExport = function(data) {
  return GameRound(data);
};
Object.assign(GameRoundExport, GameRoundModel);

module.exports = GameRoundExport;
