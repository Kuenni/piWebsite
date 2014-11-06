/**
 * New node file
 */

function createTimelinePlot(data) {
	console.log("CreateTimelinePlot was called");
	var margin = {top: 20, right: 20, bottom: 30, left: 40},
	width = 960 - margin.left - margin.right,
	height = 300 - margin.top - margin.bottom;

    var yExtents = d3.extent(data, function (d) { return d[1]; });
    var xExtents = d3.extent(data, function (d) { return d[0]; });
    var zDomain = [];
    data.forEach(function(d){
    	if(zDomain.indexOf(d[2]) == -1)
    		zDomain.push(d[2]);
    });
	
	var dataX = [4, 8, 3, 6, 2, 9];

	var svg = d3.select(".chart")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var x = d3.scale.linear()
	.range([0, width])
	.domain([0,xExtents[1]+1]);

	var y = d3.scale.linear()
	.range([height, 0])
	.domain([0,yExtents[1]]);

	var z = d3.scale.category10().domain(zDomain);
	
	var xAxis = d3.svg.axis()
	.scale(x)
	.orient("bottom");

	var yAxis = d3.svg.axis()
	.scale(y)
	.orient("left");

	svg.append("g")
	.attr("class", "x axis")
	.attr("transform", "translate(0," + height + ")")
	.call(xAxis)
	.append("text")
	.attr("class", "label")
	.attr("x", width)
	.attr("y", -6)
	.style("text-anchor", "end")
	.text("Spieltag");

	svg.append("g")
	.attr("class", "y axis")
	.call(yAxis)
	.append("text")
	.attr("class", "label")
	.attr("transform", "rotate(-90)")
	.attr("y", 6)
	.attr("dy", ".71em")
	.style("text-anchor", "end")
	.text("Punkte");

	svg.selectAll(".dot")
	.data(data)
	.enter().append("circle")
    .attr("class", "dot")
    .attr("r", 3.5)
    .attr("cx", function(d) { return x(d[0]); })
    .attr("cy", function(d) { return y(d[1]); })
    .style("fill", function(d) { return z(d[2]); });
	
	legend = svg.append("g")
	  .attr("class","legend")
	  .attr("width", 100)
    .attr("height", 50)
    .attr("x",width-100)
    .attr("y",height-50)
	  .style("font-size","12px");
	
	legend.selectAll('g').data(zDomain)
	.enter().append('g')
	.attr("transform","translate(" + (width - 100) + ",0)")
	.each(function(d,i){
		var g = d3.select(this);
		g.append("circle")
		.attr("r",3.6)
		.attr("cy",3.5 + i*15)
		.attr("cx",3.5)
		.attr("fill",z(d));
		g.append("text")
	    .attr("x", 10.5)
	    .attr("y", 3.5 + i*15)
	    .attr("dy", ".35em")
	    .text(function(d) { return d; });
	});
}

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
} ]).controller('pointsTimeline', [ '$scope','$http', function($scope,$http) {
	$scope.getPointsTimeline = function(){
		$http({
			method:'GET',
			url:'/database/userRankingTimeline'
		}).success(function(data,status,header,config){
			d3Data = [];
			data.timeline.forEach(function(timelineObject){
				user = timelineObject.User;
				timelineObject.PointsWithTime.forEach(function(matchDayObject){
					day = matchDayObject.Day;
					points = matchDayObject.PointsSum;
					d3Data.push([day,points,user]);
				});
			});
			createTimelinePlot(d3Data);
		}).error(function(data,status,header,config){
			console.log("Fehler beim erstellen des Punkteverlaufs");
		});
	};
} ]);

