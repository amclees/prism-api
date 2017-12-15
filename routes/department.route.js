const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Department = mongoose.model('Department');

router.get('/departments', function(req, res) {
  Department.find({}, function(err, department){
    if (err)
      res.send(err);
    res.json(department);
  });
});

module.exports = router;
