/**
 * New node file
 */

angular.module('overview', []).controller('ranking', [ '$scope','$http', function($scope,$http) {
	$scope.getRanking = function(){
		var teams = [];
		$http({
			method:'GET',
			url:'/database/ranking'
		}).success(function(data,status,header,config){
			teams = data;
			$scope.Teams = teams;
		}).error(function(data,status,header,config){
			alert('Fehler beim Laden der Tabelle!');
		});
	};
} ]).controller('userRanking', [ '$scope','$http', function($scope,$http) {
	$scope.getUserRanking = function(){
		$http({
			method:'GET',
			url:'/database/userRanking'
		}).success(function(data,status,header,config){
			$scope.Users = data;
		}).error(function(data,status,header,config){
			alert('Fehler beim Laden der Benutzertabelle!');
		});
	};
} ]).controller('userRankingOld', [ '$scope','$http', function($scope,$http) {
	$scope.getUserRanking = function(){
		$http({
			method:'GET',
			url:'/database/userRanking'
		}).success(function(data,status,header,config){
			data.forEach(function(user){
				user.Points -= 2*user.Correct;
				user.Points -= 2*user.Difference;
				user.Tendency += user.Difference;
			});
			$scope.Users = data;
		}).error(function(data,status,header,config){
			alert('Fehler beim Laden der Benutzertabelle!');
		});
	};
} ]);