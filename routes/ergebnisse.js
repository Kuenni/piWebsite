var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('ergebnisse', { title: 'Bitte Spieltag auswaehlen und Ergebnisse eintragen.' });
});

module.exports = router;
