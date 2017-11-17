const express = require('express');
const router = express.Router();

router.post('/reviews', function(req, res) {
  res.send('Success');
});

module.exports = router;
