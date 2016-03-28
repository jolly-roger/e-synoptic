import app from './../app';

app.controller('cities', ['$scope', 'citiesService', function($scope, citiesService){
    $scope.cities = [];
    
    citiesService().then((cities) => {
        $scope.cities = cities;
    })
}]);