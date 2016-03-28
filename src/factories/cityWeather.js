import app from './../app';

app.service('cityWeatherService', ['abstractWeatherService', function (abstractWeatherService) {
    return abstractWeatherService('http://api.openweathermap.org/data/2.5/weather');
}]);