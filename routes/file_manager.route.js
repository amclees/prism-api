const multer = require('multer');
const path = require('path');

const express = require('express');
const router = express.Router();

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads');
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({storage: storage}).single('userFile');

router.post('/file_manager', function(req, res) {
  upload(req, res, function(err) {
    if (err) {
      res.json({
        success: false,
        message: 'File not uploaded'
      });
    }
    res.json({
      success: true,
      message: 'File uploaded!'
    });
  });
});

module.exports = router;
