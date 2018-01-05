const express = require('express');
const router = express.Router();
const passport = require('passport');

router.get('/test_endpoint', passport.authenticate('jwt', {session: false}), function(req, res) {
  res.send(`Successful authentication as ${req.user.username}`);
});

module.exports = router;
