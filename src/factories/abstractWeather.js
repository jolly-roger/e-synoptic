import app from './../app';

const APPID = '0944e0c53a222bd4b4c0b96632596c25';
const RETRIES = 3;

app.service('abstractWeatherService', ['$http', '$q', function ($http, $q) {
    return (baseurl) => {
        return (function (baseurl) {
            function getAbstractWeather (name, countryCode, depth) {
                return $q((resolve, reject) => {
                    $http.get(`${baseurl}?q=${name},${countryCode}&appid=${APPID}&units=metric`)
                    .then((data) => {
                        resolve(data.data);
                    })
                    .catch((err) => {
                        console.log(`Can't receive data for ${name}`, err);
                        
                        if (depth < RETRIES) {
                            resolve(getAbstractWeather(name, countryCode, (depth + 1)));
                        } else {
                            resolve();
                        }
                    });
                });
            };
    
            return (name, countryCode) => {
                return getAbstractWeather(name, countryCode, 0);
            };
        })(baseurl);
    };
}]);