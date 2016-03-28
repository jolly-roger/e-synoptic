'use strict';

var _app = require('./../app');

var _app2 = _interopRequireDefault(_app);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var APPID = '0944e0c53a222bd4b4c0b96632596c25';
var RETRIES = 3;

_app2.default.service('abstractWeatherService', ['$http', '$q', function ($http, $q) {
    return function (baseurl) {
        return function (baseurl) {
            function getAbstractWeather(name, countryCode, depth) {
                return $q(function (resolve, reject) {
                    $http.get(baseurl + '?q=' + name + ',' + countryCode + '&appid=' + APPID + '&units=metric').then(function (data) {
                        resolve(data.data);
                    }).catch(function (err) {
                        console.log('Can\'t receive data for ' + name, err);

                        if (depth < RETRIES) {
                            resolve(getAbstractWeather(name, countryCode, depth + 1));
                        } else {
                            resolve();
                        }
                    });
                });
            };

            return function (name, countryCode) {
                return getAbstractWeather(name, countryCode, 0);
            };
        }(baseurl);
    };
}]);