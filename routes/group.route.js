const express = require('express');
const router = express.Router();

router.param('group_id', function(req, res, next, id) {
  next();
});

router.route('/group').get(function(req, res) {
  res.send('Success');
});

module.exports = router;
