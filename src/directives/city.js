import app from './../app';

app.directive('city', ['cityWeatherService', 'forecastWeatherService', 'meteogramService',
    function(cityWeatherService, forecastWeatherService, meteogramService) {
        return {
            restrict: 'E',
            templateUrl: 'templates/city.html',
            link: ($scope) => {
                $scope.temp;
                $scope.wind;
                
                cityWeatherService($scope.value.name, $scope.value.countryCode)
                .then((data) => {
                    if (data) {
                        $scope.temp = data.main ? data.main.temp : undefined;
                        $scope.wind = data.wind ? data.wind.speed : undefined;
                    }
                });
                
                $scope.onMousedown = (index) => {
                    forecastWeatherService($scope.value.name, $scope.value.countryCode)
                    .then((data) => {
                        window.meteogram = new meteogramService(data, 'container',
                            $scope.value.name, $scope.value.countryCode);
                    });
                };
            }
        };
    }
]);