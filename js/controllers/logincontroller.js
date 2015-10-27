"use strict";
(function() {
    
    var logincontroller = function ($scope, $rootScope, AUTH_EVENTS, AuthService) {
		  $scope.credentials = {
		    username: '',
		    password: ''
		  };
		  $scope.login = function(credentials){
		  	AuthService.login(credentials).then(function(user){
		  		$rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
		  		$scope.setCurrentUser(user);
		  	}, function(error){
	  		 	$rootScope.$broadcast(AUTH_EVENTS.loginFailed);
		  	});
		  };
    };
    
    logincontroller.$inject = ['$scope', '$rootScope', 'AUTH_EVENTS', 'AuthService'];

    angular.module('loginApp')
      .controller('logincontroller', logincontroller);
    
}());