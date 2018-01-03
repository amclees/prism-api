const express = require('express');
const router = express.Router();
const passport = require('passport');



router.get('/test_endpoint', passport.authenticate('jwt', {session: false}), function(req, res) {
 res.send('successfull token');
});

module.exports = router;
