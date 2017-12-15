const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const College = mongoose.model('College');

router.get('/colleges', function(req, res) {
  College.find({}, function(err, college){
    if (err)
      res.send(err);
    res.json(college);
  });
});

module.exports = router;
