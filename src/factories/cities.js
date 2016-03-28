import app from './../app';

app.service('citiesService', ['$http', function ($http) {
    return () => {
        return $http.get('data/cities.json')
            .then((data) => data.data)
            .catch((err) => console.log('Can\'t receive cities', err));
    };
}]);