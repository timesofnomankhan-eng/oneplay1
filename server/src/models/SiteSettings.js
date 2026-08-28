const { SiteSettings, SiteSettingsModel } = require('../db');

const SiteSettingsExport = function(data) {
  return SiteSettings(data);
};
Object.assign(SiteSettingsExport, SiteSettingsModel);

module.exports = SiteSettingsExport;
