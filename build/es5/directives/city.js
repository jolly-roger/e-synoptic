'use strict';

var _app = require('./../app');

var _app2 = _interopRequireDefault(_app);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_app2.default.directive('city', ['cityWeatherService', 'forecastWeatherService', 'meteogramService', function (cityWeatherService, forecastWeatherService, meteogramService) {
    return {
        restrict: 'E',
        templateUrl: 'templates/city.html',
        link: function link($scope) {
            $scope.temp;
            $scope.wind;

            cityWeatherService($scope.value.name, $scope.value.countryCode).then(function (data) {
                if (data) {
                    $scope.temp = data.main ? data.main.temp : undefined;
                    $scope.wind = data.wind ? data.wind.speed : undefined;
                }
            });

            $scope.onMousedown = function (index) {
                forecastWeatherService($scope.value.name, $scope.value.countryCode).then(function (data) {
                    window.meteogram = new meteogramService(data, 'container', $scope.value.name, $scope.value.countryCode);
                });
            };
        }
    };
}]);