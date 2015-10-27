"use strict";
(function() {
    
    var app = angular.module('loginApp', []);
    app.constant('appSettings', {
        title:'Authentication Application',
        version:'1.0'
    });
    app.constant('AUTH_EVENTS', {
          loginSuccess: 'auth-login-success',
          loginFailed: 'auth-login-failed',
          logoutSuccess: 'auth-logout-success',
          sessionTimeout: 'auth-session-timeout',
          notAuthenticated: 'auth-not-authenticated',
          notAuthorized: 'auth-not-authorized'
    });
    app.constant('USER_ROLES', {
          all: '*',
          admin: 'admin',
          editor: 'editor',
          guest: 'guest'
    });
    app.controller('footerController', function($scope, appSettings){
        $scope.appSettings = appSettings;
    });
    
}());
    