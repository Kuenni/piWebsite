var express = require('express');
var fs = require('fs');
var router = express.Router();

router.get('/',function(req,res){
	fs.readFile('./json/Spieltage.json',function(err,data){
		if(err) throw err;
		res.json(JSON.parse(data).Spieltage);
		res.end();
	});
});

module.exports = router;