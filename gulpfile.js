module.exports = require('godaddy-test-tools')(require('gulp'), {
  sourceFiles: ['index.js'],
  unitTestFiles: 'test/unit/**/*.js',
  lint: {
    eslint: {
      fix: (process.env.NODE_ENV || 'local') === 'local' // eslint-disable-line no-process-env
    }
  }
});
