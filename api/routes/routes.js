'use strict';
module.exports = function(app) {
  var depFetcher = require('../controllers/depFetchController');

  app.route('/dependencies/:packagename/:version')
    .get(depFetcher.fetchDependencies);
    app.route('/dependencies/:packagename')
    .get(depFetcher.fetchDependencies);
};