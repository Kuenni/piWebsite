/**
 * New node file
 */

angular.module('app', []).controller('spieltage', [ '$scope','$http', function($scope,$http) {
	$.get('/spieltage',function(j){
		$scope.spieltageJson = j;
		$scope.selectItem = j[0];
		$scope.$apply();
	});
	$scope.users = [{name:"Kuenni",uid:1},{name:"Waldi",uid:2}];
	$scope.userItem = $scope.users[0];
	$scope.printSelectedSpieltag = function(t){
		var tag;
		if(t){
			tag = t;
		} else{
			tag = $scope.selectItem.SpieltagNr;	
		}
		var user = $scope.userItem.name;
		var userTipps = [];
		$http({
			method:'POST',
			url:'/database/usertipp',
			data:{spieltag:tag,user:user}
		}).success(function(data,status,header,config){
			userTipps = data;
			if(userTipps.length === 0){
				spieleArray = $scope.spieltageJson[Number(tag) - 1].Spiele;
				spieleArray.forEach(function(Spiel){
					userTipps.push({
						Heim:Spiel.Heim,
						Gast:Spiel.Gast,
						ToreHeim:'-1',
						ToreGast:'-1'
					});
				});
			}
			$scope.userTipps = userTipps;
		});
	};
	$scope.fillTable = function(){
		var tag = $scope.selectItem.SpieltagNr;
		var user = $scope.userItem.name;
		var userTipps = [];
		$scope.userTipps.forEach(function(Spiel){
			userTipps.push(
					{
						Spieltag:tag,
						User:user,
						Heim:Spiel.Heim,
						Gast:Spiel.Gast,
						ToreHeim:Spiel.ToreHeim,
						ToreGast:Spiel.ToreGast
					});
		});
		$http({
			method:'POST',
			url:'/database/usertipp/create',
			data:userTipps
		}).success(function(data,status,header,config){
			alert('Eingetragen!');
		}).error(function(data,status,header,config){
			alert('Datenbankeintrag fehlgeschlagen!');
		});
	};
} ]).controller('ergebnisseEintragen', [ '$scope','$http', function($scope,$http) {
	$.get('/spieltage',function(j){
		$scope.spieltageJson = j;
		$scope.selectItem = j[0];
		$scope.$apply();
	});
	$scope.printSelectedSpieltag = function(t){
		var tag;
		if(t){
			tag = t;
		} else{
			tag = $scope.selectItem.SpieltagNr;	
		}
		var spiele = [];

		$http({method:'POST',url:'/database/spieltag',data:{spieltag:tag}}).success(function(data,status,header,config){
			spiele=data;
			if(!$scope.spieltageJson)
				return;
			spieleArray = $scope.spieltageJson[Number(tag) - 1].Spiele;
			spieleArray.forEach(function(Spiel){
				var gameExists = false;
				for (var i = 0; i < spiele.length; i++) {
					if( Spiel.Heim == spiele[i].Heim ){
						gameExists = true;
					}
				}
				if(!gameExists){
					spiele.push({
						Heim:Spiel.Heim,
						Gast:Spiel.Gast,
						ToreHeim:'-1',
						ToreGast:'-1'
					});
				}
			});
			$scope.spiele = spiele;
		});

	};
	$scope.fillTable = function(){
		var tag = $scope.selectItem.SpieltagNr;
		var tableData = {tableData:[]};
		$scope.spiele.forEach(function(Spiel){
			tableData.tableData.push(
					{
						Tag:tag,
						Heim:Spiel.Heim,
						Gast:Spiel.Gast,
						ToreHeim:Spiel.ToreHeim,
						ToreGast:Spiel.ToreGast
					});
		});
		$.ajax ({
			url: 'database',
			type: "POST",
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			data: JSON.stringify(tableData),
			success: function(){
				alert("Eingetragen!");
			},
			error: function(){
				alert('Datenbankeintrag fehlgeschlagen!');
			}
		});
	};
} ]);