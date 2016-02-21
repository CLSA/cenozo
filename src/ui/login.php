<!doctype html>
<html lang="en" ng-app="loginApp">
<head>
  <meta charset="utf-8">
  <title><?php echo APP_TITLE; ?></title>
  <link rel="shortcut icon" href="img/favicon.ico">
  <link rel="stylesheet" href="<?php print LIB_URL; ?>/bootstrap/dist/css/bootstrap.css">
  <link rel="stylesheet" href="<?php print CSS_URL; ?>/cenozo.css?build=<?php print CENOZO_BUILD; ?>">
  <link rel="stylesheet" href="<?php print ROOT_URL; ?>/css/theme.css?_">

  <script src="<?php print LIB_URL; ?>/jquery/dist/jquery.js"></script>
  <script src="<?php print LIB_URL; ?>/bootstrap/dist/js/bootstrap.js"></script>
  <script src="<?php print LIB_URL; ?>/angular/angular.js"></script>
  <script src="<?php print LIB_URL; ?>/angular-bootstrap/ui-bootstrap-tpls.js"></script>

  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="-1">
</head>
<body class="background">
  <script>
    var loginApp = angular.module( 'loginApp', [] );
    loginApp.controller( 'LoginCtrl', [
      '$scope', '$http', '$window',
      function( $scope, $http, $window ) {
        $scope.state = 'ready';
        $scope.processing = false;
        $scope.baseUrl = '<?php print ROOT_URL; ?>';
        $scope.loginChanged = function() { $scope.state = 'ready'; };
        $scope.login = function() {
          $scope.state = 'processing';
          var form = $scope.loginForm;
          form.username.$dirty = true;
          form.password.$dirty = true;

          if( !form.$invalid ) {
            var auth = btoa( $scope.username + ':' + $scope.password );
            $http( {
              url: $scope.baseUrl + '/api/self/0',
              method: 'POST',
              headers: { Authorization: 'Basic ' + auth }
            } ).then( function( response ) {
              if( 201 == response.status ) {
                // login successful, reload page
                $window.location.reload();
              } else {
                // login unsuccessful
                $scope.state = 'failed';
              }
            } ).catch( function( response ) {
              $scope.state = 'error';
            } );
          } else {
            $scope.state = 'ready';
          }
        };
      }
    ] );
  </script>
  <nav class="navigation-header navbar navbar-default noselect">
    <div class="container-fluid bg-primary no-line-height">
      <div class="navbar-header">
        <a class="navbar-brand" data-toggle="dropdown"><?php echo APP_TITLE; ?></a>
      </div>
      <div class="navbar-collapse">
        <ul class="nav navbar-nav">
          <div class="breadcrumb breadcrumb-slash">
            <li class="navbar-item">Login</li>
          </div>
        </ul>
      </div>
    </div>
  </nav>
  <div class="container-fluid noselect outer-view-frame">
    <div class="inner-view-frame">
      <div class="container-fluid bg-white" style="padding-top: 1em; padding-bottom:4em;">
        <div class="container">
          <div class="record-view rounded" ng-controller="LoginCtrl">
            <form ng-submit="login()" novalidate name="loginForm" class="form-horizontal">
              <div class="container-fluid bg-primary rounded-top"><h4>
                Login Required
                {{ 'processing' == state ? '(please wait)' : '' }}
              </h4></div>
              <div class="container-fluid form-body">
                <p class="text-info">
                  You must log in to access the application:
                </p>
                <hr />
                <div class="container-fluid form-group"
                     ng-class="{ 'has-feedback has-error':
                                 loginForm.username.$dirty && loginForm.username.$invalid }">
                  <label for="username" class="col-sm-3 control-label">Username</label>
                  <div class="col-sm-9">
                    <div class="input-group"
                         ng-class="{ 'has-feedback has-error':
                                     loginForm.username.$dirty && loginForm.username.$invalid }">
                      <input id="username"
                             name="username"
                             ng-model="username"
                             class="form-control"
                             type="text"
                             ng-change="loginChanged()"
                             ng-disabled="'processing' == state"
                             required autofocus></input>
                      <span ng-if="loginForm.username.$invalid && loginForm.username.$dirty">
                        <span class="help-block" ng-if="loginForm.username.$error.required">Cannot be blank</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div class="container-fluid form-group"
                     ng-class="{ 'has-feedback has-error':
                                 loginForm.password.$dirty && loginForm.password.$invalid }">
                  <label for="password" class="col-sm-3 control-label">Password</label>
                  <div class="col-sm-9">
                    <div class="input-group"
                         ng-class="{ 'has-feedback has-error':
                                     loginForm.password.$dirty && loginForm.password.$invalid }">
                      <input id="password"
                             name="password"
                             ng-model="password"
                             class="form-control"
                             type="password"
                             ng-change="loginChanged()"
                             ng-disabled="'processing' == state"
                             required></input>
                      <span ng-if="loginForm.password.$invalid && loginForm.password.$dirty">
                        <span class="help-block" ng-if="loginForm.password.$error.required">
                          Please provide your password
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                <span ng-if="'failed' == state" class="help-block text-right has-feedback has-error">
                  The credentials you provided are either invalid or do not exist, please try again.
                </span>
              </div>
              <div class="form-footer text-right rounded-bottom bg-info">
                <button type="submit" class="btn btn-primary" ng-disabled="'processing' == state">Login</button>
              </div> 
            </form>
          </div>
        </div>
      </div>
    </div>
    <div class="gradient-footer"></div>
  </div>
</body>
</html>
