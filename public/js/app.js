/**
 * New node file
 */

angular.module('app', []).controller('spieltage', [ '$scope', function($scope) {
	$scope.printSelectedSpieltag = function(){
		var tag = $scope.selectItem.SpieltagNr;
		var spieleArray = $scope.spieltageJson[Number(tag) - 1].Spiele;
		var userTipp = [];
		spieleArray.forEach(function(Spiel){
			userTipp.push({
				Heim:Spiel.Heim,
				Gast:Spiel.Gast,
				toreHeim:'-',
				toreGast:'-',
				ergebnisHeim:'x',
				ergebnisGast:'x'
			});
		});
		$scope.userTipps = userTipp;
	};
	$scope.users = [{name:"Kuenni",uid:1},{name:"Waldi",uid:2}];
	$scope.userItem = $scope.users[0];
	$.get('/spieltage',function(j){
		$scope.spieltageJson = j;
		$scope.selectItem = j[0];
		$scope.$apply();
	});
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
		        //
		    }
		});
	};
} ]);