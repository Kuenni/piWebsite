/**
 * New node file
 */

//Declare variables for modules
var express = require('express');
var router = express.Router();
var dblite = require('dblite');
var util = require('util');
var fs = require('fs');
var async = require('async');

//Create the database variable
var db = dblite('./data/tipps.sqlite');

//Creates a table for storing game results
function createResultTableIfNotExist(){
	db.query('CREATE TABLE if not exists Ergebnisse (Spieltag int,Heim varchar(255),Gast varchar(255),ToreHeim int,ToreGast int)');
};

//Creates a table for storing the user bets 
function createUserBetTableIfNotExists(){
	db.query('CREATE TABLE if not exists UserTipps (Spieltag int,User varchar(255),Heim varchar(255),Gast varchar(255),ToreHeim int,ToreGast int)');
}

//Creates a table for the team ranking
//TODO: Do I need this?
function createRankingTableIfNotExist(){
	db.query('CREATE TABLE if not exists Rankings (Team varchar(255),Punkte int,S int, U int, N int)');
}

//Creates a table to store the team names.
//This simplifies iterating over all team names
function createTeamTableIfNotExist(){
	db.query('SELECT name FROM sqlite_master WHERE type=\'table\' ',function(err,rows){
		if(err){
			console.log(err);
			return err;
		}
		var tableExists = false;
		rows.forEach(function(r){
			if(r[0]=='Teams'){
				tableExists=true;
			}
			});
		if(!tableExists){
			fs.readFile('./json/Spieltage.json',function(err,data){
				var uniques = [];
				JSON.parse(data).Spieltage.forEach(function(Spieltag){
					Spieltag.Spiele.forEach(function(Spiel){
						if(uniques.indexOf(Spiel.Heim) === -1)
							uniques.push(Spiel.Heim);
					});
				});
				db.query('CREATE TABLE Teams (Team varchar(255))');
				uniques.forEach(function(team){
					db.query('INSERT INTO Teams (Team) VALUES(:Team)',{Team:team});
				});
			});
		}
	});	
}

/**
 * Calculates the points for a game.
 * Useful for creating the team ranking
 * @param goals The goals team 1 scored.
 * @param goalsOpponent The goals the other team scored
 * @returns {Number} The points depeding on the game result.
 */
function getPoints(goals,goalsOpponent){
	if(goals < 0 || goalsOpponent < 0)
		return -1;
	if(goals - goalsOpponent > 0){
		return 3;
	} else if(goals - goalsOpponent == 0){
		return 1;
	}else{
		return 0;
	}
}

function getPointsForTeam(err,callback,team,ranking){
	var points = 0;
	var s = 0;
	var u = 0;
	var n = 0;
	var gamesPlayed = 0;
	db.query('SELECT Heim, Gast, ToreHeim, ToreGast from Ergebnisse WHERE Heim=:Home OR Gast=:Guest',
		{
			Home:team.Name,
			Guest:team.Name
		},{
			Home:String,
			Guest:String,
			GoalsHome:Number,
			GoalsGuest:Number
	},function(err,rows){
		if(err){
			console.log('GetAllResults Error');
			return callback(err);
		}
		rows.forEach(function(Game){
			var pointsFromGame = 0;
			if(Game.Home == team.Name){
				pointsFromGame = getPoints(Game.GoalsHome,Game.GoalsGuest);
			}else{
				pointsFromGame = getPoints(Game.GoalsGuest,Game.GoalsHome);
			}
			switch (pointsFromGame) {
			case 3:
				points += 3;
				s++;
				gamesPlayed++;
				break;
			case 1:
				points++;
				gamesPlayed++;
				u++;
				break;
			case 0:
				gamesPlayed++;
				n++;
				break;
			case -1:
				break;
			default:
				break;
			}
		});
		ranking.push({
			Team:team.Name,
			Points:points,
			S:s,
			U:u,
			N:n,
			Played:gamesPlayed
		});
		callback(null,ranking);
	});//end callback for all games
}

function createRanking(callback){
	var ranking = [];
	db.query('SELECT * from Teams',{Name:String},function(err,rows){
		if(err){
			console.log('GetTeams Error');
			return callback(err);
		}
		var asyncCalls = [];
		rows.forEach(function(team){
				asyncCalls.push(function(callback){
					getPointsForTeam(err,callback,team,ranking);
				});
		});//end callback for all teams
		async.parallel(asyncCalls,function(err,results){
			if (err) return callback(err);
			return callback(null,ranking);
		});
		
	});
}

router.get('/ranking',function(req,res){
	createTeamTableIfNotExist();
	createRankingTableIfNotExist();
	createRanking(function(err,ranking){
		if(err){
			console.log('Error creating Ranking!');
			res.status(500).end();
		}
		console.log('Done');
		ranking.sort(function(a,b){
			return b.Points - a.Points;
		});
		console.log(ranking);
		res.send(ranking);
		res.end();
	});
});

router.post('/usertipp',function(req,res){
	createUserBetTableIfNotExists();
	var spieltag = req.body.spieltag;
	var user = req.body.user;
	db.query('SELECT * FROM UserTipps WHERE Spieltag=:Tag AND User=:User',{Tag:spieltag,User:user},{
		Spieltag:Number,
		User:String,
		Heim:String,
		Gast:String,
		ToreHeim:Number,
		ToreGast:Number
	},function(err,rows){
		if(err){
			console.log(err);
			return res.status(500).end();
		}
		res.send(rows);
		res.end();
	});
});

router.post('/usertipp/create',function(req,res){
	createUserBetTableIfNotExists();
	var userTipps = req.body;
	var errCondition = false;
	userTipps.forEach(function(Spiel){
		db.query('SELECT * FROM UserTipps WHERE Spieltag=:Spieltag AND User=:User AND Heim=:Heim;',{
			Spieltag:Spiel.Spieltag,
			User:Spiel.User,
			Heim:Spiel.Heim
		},function(err,rows){
			if(err){
				errCondition = true;
				console.log(err);
				return;
			}
			if(rows && rows[0]){
				db.query('UPDATE UserTipps SET ToreHeim=:ToreHeim WHERE Spieltag=:Spieltag AND User=:User AND Heim=:Heim',{
					ToreHeim:Spiel.ToreHeim,
					Spieltag:Spiel.Spieltag,
					User:Spiel.User,
					Heim:Spiel.Heim
				});
				db.query('UPDATE UserTipps SET ToreGast=:ToreGast WHERE Spieltag=:Spieltag AND User=:User AND Heim=:Heim',{
					ToreGast:Spiel.ToreGast,
					Spieltag:Spiel.Spieltag,
					User:Spiel.User,
					Heim:Spiel.Heim
				});
			} else{
				db.query('INSERT INTO UserTipps (Spieltag,User,Heim,Gast,ToreHeim,ToreGast) \
						VALUES(:Tag,:User,:Heim,:Gast,:ToreHeim,:ToreGast)',{
							Tag:Spiel.Spieltag,
							User:Spiel.User,
							Heim:Spiel.Heim,
							Gast:Spiel.Gast,
							ToreHeim:Spiel.ToreHeim,
							ToreGast:Spiel.ToreGast
				});
			}
		});
	});
	if(errCondition){
		res.status(500).end();
	} else{
		res.send({result:"success"});
		res.end();
	}
});

router.post('/',function(req,res){
	var errCondition = false;
	createResultTableIfNotExist();
	var tableData = req.body.tableData;
	tableData.forEach(function(Spiel){
		var query = util.format('SELECT * FROM Ergebnisse WHERE Spieltag=%d AND Heim="%s";',Spiel.Tag,Spiel.Heim);
		db.query(query,function(err,rows){
			if(err){
				console.log(err);
				errCondition = true;
			}
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
							ToreGast:Spiel.ToreGast
				});
			}
		});
	});
	if(errCondition){
		res.status(500).end();
	} else{
		res.send({result:"success"});
		res.end();
	}
	
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
			return res.status(500).end();
		}
		res.send(rows);
	});
});

router.get('/', function(req, res) {
	  res.render('database', { title: 'Tippspiel' });
});

module.exports = router;


