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
	$scope.printSelectedSpieltag = function(){
		var tag = $scope.selectItem.SpieltagNr;
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
			alert('Submit successful!');
		});
	};
} ]).controller('ergebnisseEintragen', [ '$scope','$http', function($scope,$http) {
	$.get('/spieltage',function(j){
		$scope.spieltageJson = j;
		$scope.selectItem = j[0];
		$scope.$apply();
	});
	$scope.printSelectedSpieltag = function(){
		var spiele = [];
		var tag = $scope.selectItem.SpieltagNr;
		
		$http({method:'POST',url:'/database/spieltag',data:{spieltag:tag}}).success(function(data,status,header,config){
			spiele=data;
			if(spiele.length === 0){
				spieleArray = $scope.spieltageJson[Number(tag) - 1].Spiele;
				spieleArray.forEach(function(Spiel){
					spiele.push({
						Heim:Spiel.Heim,
						Gast:Spiel.Gast,
						ToreHeim:'-',
						ToreGast:'-'
					});
				});
			}
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
		    	console.log('Post successful');
		    },
		    error: function(){
		    	alert('Datenbankeintrag fehlgeschlagen!');
		    }
		});
	};
} ]);