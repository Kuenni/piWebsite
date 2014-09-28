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

/**
 * Calculate the points for a given set of user bet and game result
 * @param betHome
 * @param betGuest
 * @param goalsHome
 * @param goalsGuest
 * @returns {Number}
 */
function getUserPoints(betHome,betGuest,goalsHome,goalsGuest){
	if(betHome == -1 || betGuest == -1 || goalsHome == -1 || goalsGuest == -1){
		return -1;
	}
	var diffBet = betHome - betGuest;
	var diffResult = goalsHome - goalsGuest;
	//Same difference
	if(diffBet == diffResult){
		//Also same result
		if(betHome == goalsHome){
			//Max points
			return 5;
		} else{
			//else only right goal difference
			return 3;
		}
		//Rest for tendency
	} else if(diffBet > 0 && diffResult > 0){
		return 1;
	} else if(diffBet < 0 && diffResult < 0){
		return 1;
	}
	return 0;
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
		ranking.sort(function(a,b){
			return b.Points - a.Points;
		});
		res.send(ranking);
		res.end();
	});
});

function getRankingForUser(err, callback, user, ranking){
	var points = 0;
	var nCorrect = 0;
	var nDiffernece = 0;
	var nTendency = 0;
	var nWrong = 0;
	db.query('SELECT ergebnisse.heim, ergebnisse.gast, ergebnisse.toreHeim, ergebnisse.toreGast,\
		usertipps.toreheim, usertipps.toregast FROM ergebnisse\
		INNER JOIN userTipps ON userTipps.Heim = ergebnisse.Heim\
		WHERE usertipps.User=:User AND ergebnisse.Gast = usertipps.Gast',
		{
			User:user
		},{
			Home:String,
			Guest:String,
			goalsHome:Number,
			goalsGuest:Number,
		betHome:Number,
		betGuest:Number
		},function(err,rows){
			if(err){
				console.log('GetAllResults Error');
				return callback(err);
			}
			rows.forEach(function(Game){
				var pointsForGame = getUserPoints(Game.betHome, Game.betGuest,
						Game.goalsHome, Game.goalsGuest);
				switch (pointsForGame) {
				case 5:
					nCorrect++;
					break;
				case 3:
					nDiffernece++;
					break;
				case 1:
					nTendency++;
					break;
				case 0:
					nWrong++;
					break;
				default:
					break;
				}
				if(pointsForGame != -1){
					points += pointsForGame;
				}
			});
			ranking.push({
				User:user,
				Points:points,
				Correct:nCorrect,
				Difference:nDiffernece,
				Tendency:nTendency,
				Wrong:nWrong
			});
			return callback(null,ranking);
	});//End callback for users
}

function createUserRanking(callback){
	var asyncCalls = [];
	var ranking = [];
	db.query('SELECT DISTINCT User FROM Usertipps',
			function(err,rows){
		if(err) {
			console.log("Error on distinct user");
			return err;
		}
		if(rows.length && rows[0]){
			rows.forEach(function(row){
				asyncCalls.push(function(cb){
					getRankingForUser(err,cb,row[0],ranking);
				});
			});
			async.parallel(asyncCalls,function(err,results){
				if(err){
					console.log("Error in async calls");
					return callback(err);
				}
				return callback(null,ranking);
			});
		}
	});//db query
}



/**
 * router function that is used to get the ranking for the user bets
 */
router.get('/userRanking',function(req,res){
	createUserRanking(function(err,ranking){
		if(err){
			console.log("Err in create user ranking");
			res.status(500).end();
			return err;
		}
		ranking.sort(function(a,b){
			return b.Points - a.Points;
		});
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

/**
 * on toplevel request for the database sublink render the page
 */
router.get('/', function(req, res) {
	res.render('database', { title: 'Tippspiel' });
});

module.exports = router;


