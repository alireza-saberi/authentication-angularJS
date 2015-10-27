##Authentication in AngularJS
The most common form of authentication is logging in with a username (or email address) and password. This means implementing a login form where users can enter their credentials. Such a form could look like this:

```
<form name="loginForm" ng-controller="logincontroller" ng-submit="login(credentials)" novalidate>
  <div class="form-group">
    <label for="username">Username:</label>
    <input type="text" id="username" ng-model="credentials.username" class="form-control">
  </div>
 <div class="form-group">      
    <label for="password">Password:</label>
    <input type="password" id="passworangulauthserviced" ng-model="credentials.password" class="form-control">
  </div>
    <button type="submit" class="btn btn-default">Submit</button>
</form>
```

Since this is an Angular-powered form, we use the ngSubmit directive to trigger a scope function on submit. Note that we’re passing the credentials as an argument rather than relying on $scope.credentials, this makes the function easier to unit-test and avoids coupling between the function and it’s surrounding scope. The corresponding controller could look like this:

```
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
```

The first thing to notice is the absence of any real logic. This was done deliberately so to decouple the form from the actual authentication logic. It’s usually a good idea to abstract away as much logic as possible from your controllers, by putting that stuff in services. AngularJS controllers should only manage the $scope object (by watching and manipulating) and not do any heavy lifting.

## Communicating session changes
Authenticating is one of those things that affect the state of the entire application. For this reason I prefer to use events (with $broadcast) to communicate changes in the user session. It’s a good practice to define all of the available event codes in a central place.
So out app.js will be like this
```
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
```
## The AuthService
The logic related to authentication and authorization (access control) is best grouped together in a service:
```
"use strict";
(function(){
       var AuthService = function($http, Session){
        var authService = {};
       
        authService.login = function (credentials) {
          return $http
            .post('/login', credentials)
            .then(function (res) {
              Session.create(res.data.id, res.data.user.id,
                             res.data.user.role);
              return res.data.user;
            });
        };
       
        authService.isAuthenticated = function () {
          return !!Session.userId;
        };
       
        authService.isAuthorized = function (authorizedRoles) {
          if (!angular.isArray(authorizedRoles)) {
            authorizedRoles = [authorizedRoles];
          }
          return (authService.isAuthenticated() &&
            authorizedRoles.indexOf(Session.userRole) !== -1);
        };
       
        return authService;
    };
    AuthService.$inject = ['$http', 'Session'];
    angular.module('loginApp').factory('AuthService', AuthService);
}());
```
To further separate concerns regarding authentication, I like to use another service (a singleton object, using the service style) to keep the user’s session information. The specifics of this object depends on your back-end implementation, but I’ve included a generic example below.
```
"use strict";
(function(){
    var Session = function(){
            this.create = function (sessionId, userId, userRole) {
            this.id = sessionId;
            this.userId = userId;
            this.userRole = userRole;
          };
          this.destroy = function () {
            this.id = null;
            this.userId = null;
            this.userRole = null;
          };
    };
    angular.module('loginApp').service('Session', Session);
}());
```
Once a user is logged in, his information should probably be displayed somewhere (e.g. in the top-right corner). In order to do this, the user object must be referenced in the $scope object, preferably in a place that’s accessible to the entire application. While $rootScope would be an obvious first choice, I try to refrain from using $rootScope too much (actually I use it only for global event broadcasting). Instead my preference is to define a controller on the root node of the application, or at least somewhere high up in the DOM tree. The body tag is a good candidate:
```
<body ng-controller="ApplicationController">
  ...
</body>
```
The ApplicationController is a container for a lot of global application logic, and an alternative to Angular’s run function. Since it’s at the root of the $scope tree, all other scopes will inherit from it (except isolate scopes). It’s a good place to define the currentUser object:
```
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
```
We’re not actually assigning the currentUser object, we’re merely initializing the property on the scope so the currentUser can later be accessed throughout the application. Unfortunately we can’t simply assign a new value to it from a child scope, because that would result in a shadow property. It’s a consequence of primitive types (strings, numbers, booleans, undefined and null) being passed by value instead of by reference. To circumvent shadowing, we have to use a setter function.

## Access control
Authorization a.k.a. access control in AngularJS doesn’t really exist. Since we’re talking about a client-side application, all of the source code is in the client’s hands. There’s nothing preventing the user from tampering with that code to gain ‘access’ to certain views and interface elements. All we can really do is visibility control. If you need real authorization you’ll have to do it server-side, but that’s beyond the scope of this article.

AngularJS comes with several directives to show or hide an element based on some scope property or expression: ngShow, ngHide, ngIf and ngSwitch. The first two will use a style attribute to hide the element, while the last two will actually remove the element from the DOM.
The first solution (hiding it) is best used only when the expression changes frequently and the element doesn’t contain a lot of template logic and scope references. The reason for this is that any template logic within a hidden element will still be reevaluated on each digest cycle, slowing down the application. The second solution will remove the DOM element entirely, including any event handlers and scope bindings. Changing the DOM is a lot of work for the browser (hence the reason for using ngShow/ngHide in some cases), but worth the effort most of the time. Since user access doesn’t change often, using ngIf or ngSwitch is the best choice
