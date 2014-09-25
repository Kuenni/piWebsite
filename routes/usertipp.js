var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('usertipp', { title: 'Tippspiel' });
});

module.exports = router;
