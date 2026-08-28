const { User, UserModel } = require('../db');

// Merge instance constructor with static model methods
const UserExport = function(data) {
  return User(data);
};
Object.assign(UserExport, UserModel);

module.exports = UserExport;
