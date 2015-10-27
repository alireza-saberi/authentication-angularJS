"use strict";
(function() {
    
    var applicationcontroller = function ($scope, USER_ROLES, AuthService) {
		  $scope.currentUser = null;
		  $scope.userRoles = USER_ROLES;
		  $scope.isAuthorized = AuthService.isAuthorized;
		 
		  $scope.setCurrentUser = function (user) {
		    $scope.currentUser = user;
		  };
    };
    
    applicationcontroller.$inject = ['$scope', 'USER_ROLES', 'AuthService'];

    angular.module('loginApp')
      .controller('applicationcontroller', applicationcontroller);
    
}());