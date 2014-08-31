/**
 * New node file
 */

var express = require('express');
var router = express.Router();
var dblite = require('dblite');
var util = require('util');

var db = dblite('./data/tipps.sqlite');

function createResultTableIfNotExist(){
	db.query('CREATE TABLE if not exists Ergebnisse (Spieltag int,Heim varchar(255),Gast varchar(255),ToreHeim int,ToreGast int)');
};

router.post('/',function(req,res){
	createResultTableIfNotExist();
	var tableData = req.body.tableData;
	tableData.forEach(function(Spiel){
		var query = util.format('SELECT * FROM Ergebnisse WHERE Spieltag=%d AND Heim="%s";',Spiel.Tag,Spiel.Heim);
		db.query(query,function(err,rows){
			if(err)
				console.log(err);
			if(rows && rows[0]){
				db.query('UPDATE Ergebnisse SET ToreHeim=:ToreHeim WHERE Spieltag=:Spieltag AND Heim=:Heim',{
					ToreHeim:Spiel.ToreHeim,
					Spieltag:Spiel.Tag,
					Heim:Spiel.Heim
				});
				db.query('UPDATE Ergebnisse SET ToreGast=:ToreGast WHERE Spieltag=:Spieltag AND Heim=:Heim',{
					ToreGast:Spiel.ToreGast,
					Spieltag:Spiel.Tag,
					Heim:Spiel.Heim
				});
			} else{
				db.query('INSERT INTO Ergebnisse (Spieltag,Heim,Gast,ToreHeim,ToreGast) \
						VALUES(:Tag,:Heim,:Gast,:ToreHeim,:ToreGast)',{
							Tag:Spiel.Tag,
							Heim:Spiel.Heim,
							Gast:Spiel.Gast,
							ToreHeim:Spiel.ToreHeim,
							ToreGast:Spiel.ToreGast});
			}
		});
	});
});

router.post('/spieltag',function(req,res){
	var spieltag = req.body.spieltag;
	db.query('SELECT * FROM Ergebnisse WHERE Spieltag=:Tag',{Tag:spieltag},{
		Spieltag:Number,
		Heim:String,
		Gast:String,
		ToreHeim:Number,
		ToreGast:Number
	},function(err,rows){
		if(err){
			console.log(err);
		}
		res.send(rows);
	});
});

router.get('/', function(req, res) {
	  res.render('database', { title: 'Tippspiel' });
});

module.exports = router;


