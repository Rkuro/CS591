angular.module('musichelper',['ngRoute','ngCookies'])
    .directive('nameDisplay', function () {
        return {
            scope: true,
            restrict: 'EA',
            template: "<b>This can be anything {{name}}</b>"
        }
    })
    .controller('musichelper_ctrl',function ($scope, $http,$cookies) {



        //READ (GET)
        $scope.getUsers = function () {
            $http.get('http://localhost:3000/api/db')
                .then(function (response) {
                    $scope.users = response.data
                })
        }






        $scope.initApp = function () {
            $scope.h2message = "Welcome"
            $scope.authorized = false
            $scope.showLogin = false
            $scope.getUsers()
            $scope.expandArtist = false
            $scope.collapse = false
            //Grab cookies if present
            let eventCookie = $cookies.get('showEvents')
            let authCookie = $cookies.get('authStatus')
            $scope.authorized = !!authCookie
            $scope.showEvents = !!eventCookie
            if ($scope.authorized) {
                $scope.h2message = "Welcome "
                $scope.userID = $cookies.get('user.SpotifyID')
                $scope.name = $cookies.get('user.Name')
                $scope.imageURL = $cookies.get('user.imageURL')
            }

        }

        $scope.goToEvent = function (url) {
            console.log(url)
            window.location.replace(url)
        }

        $scope.showLoginForm = function () {
            $scope.showLogin = true
        }

        // Authenticate the user with spotify
        $scope.doSpotifyAuth = function () {
            let openUrl = '/auth/spotify'
            window.location.replace(openUrl)
        }

        // This method will logout the user from Spotify
        // NOTE: This will require the user to login to spotify again if they use another application
        // Essentially this is logging the user out of spotify globally
        // Not sure if I really want to do this...
        $scope.doSpotifyLogout = function () {
            const request = {
                method: 'GET',
                url: 'http://localhost:3000/auth/logout',
                data: {
                    SpotifyID: $scope.userID
                }


            }
            $http(request)
                .then(function (response) {
                    $scope.authorized = false
                    $scope.name = ''
                    $cookies.remove('user.SpotifyID','user.name')
                    $cookies.put('authStatus',false)
                },function (error) {
                    console.log(error)
                })
        }

        $scope.expandArtist = function () {
            $scope.expandArtist = true
        }



        // Get events for the user
        // This is the main functionality of the app
        $scope.getEvents = function () {
            if (!$scope.authorized) {
                $scope.h2message = 'ERROR'
                return
            }
            const request = {
                method: 'GET',
                url: 'http://localhost:3000/auth/findEvents',
            }
            $http(request)
                .then(function (response) {

                    //response = cleanDates(response)

                    $scope.artists = response.data
                    $scope.showEvents = true
                    $cookies.put('showEvents',true)
                    console.log(response.data)

                }, function (error) {
                    $scope.h2message = "Error Getting Events"
                    $scope.name = ""
                })
        }

    })

    .config(['$routeProvider',
        function ($routeProvider) {
            $routeProvider
                .when('/:status', {
                    templateUrl: '',
                    controller: 'authController'
                })
                .when(':status', {
                    templateUrl: '',
                    controller: 'authController'
                })
                .otherwise({
                    redirectTo: '/'
                })
        }])


    .controller('authController', function ($scope) {

        let authStatus =  $location.search();
        console.log(authStatus)
        console.log('In authController')
        $scope.authorized = !!authStatus

    })


    //This controller handles toggling the display of details in the user list
    .controller('listController', function ($scope) {
        $scope.display = false

        $scope.showInfo = function () {
            $scope.display = !$scope.display
        }
    })