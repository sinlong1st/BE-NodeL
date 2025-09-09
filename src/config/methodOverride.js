// Enables HTTP method override for forms (e.g., PUT, DELETE via POST)
const methodOverride = require('method-override');
module.exports = (app) => {
  app.use(methodOverride('_method'));
};
