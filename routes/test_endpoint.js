const express = require('express');
const router = express.Router();

router.get('/test-endpoint', function(req, res) {
  res.send('Success');
});

module.exports = router;
