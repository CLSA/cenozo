<!doctype html>
<html lang="en" ng-app="loginApp">
<head>
  <meta charset="utf-8">
  <title><?php echo APP_TITLE; ?></title>
<?php $this->print_libs(); ?>
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="-1">
</head>
<body class="background">
  <script>
    var loginApp = angular.module( 'loginApp', [ 'ngSanitize' ] );
    loginApp.controller( 'LoginCtrl', [
      '$scope', '$http', '$window',
      function( $scope, $http, $window ) {
        $scope.state = 'ready';
        $scope.processing = false;
        $scope.baseUrl = '<?php print ROOT_URL; ?>';
        $scope.loginChanged = function() { $scope.state = 'ready'; };

        $scope.loginFooter = `<?php if( !is_null( $login_footer ) ) print nl2br( $login_footer ); ?>`;
        var adminEmail = '<?php print $admin_email; ?>';
        if( adminEmail ) {
          $scope.loginFooter +=
            ( 0 < $scope.loginFooter.length ? '<br/>\n' : '' ) +
            'Please contact <a href="' + adminEmail + '">' + adminEmail + '</a> if you require assistance logging in.';
        }

        $scope.browser = null;
        $scope.badVersion = false;
        var userAgent = navigator.userAgent;
        if( -1 != userAgent.indexOf( 'Edge/' ) ) {
          $scope.browser = null;
        } else if( -1 != userAgent.indexOf( 'Chrome/' ) ) {
          $scope.browser = 'Chrome';
          var version = userAgent.match( /Chrome\/([^.]+)/ )[1];
          if( <?php echo $chrome_minimum_version; ?> > version ) $scope.badVersion = version;
        } else if( -1 != userAgent.indexOf( 'Firefox/' ) ) {
          $scope.browser = 'Firefox';
          var version = userAgent.match( /Firefox\/([^.]+)/ )[1];
          if( <?php echo $firefox_minimum_version; ?> > version ) $scope.badVersion = version;
        }

        if( null != $scope.browser && !$scope.badVersion ) {
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
        <div class="container" ng-controller="LoginCtrl">
          <img src="<?php print CENOZO_URL; ?>/img/branding.png"
               class="img-responsive"
               onerror="this.style.display='none'"
               alt="" />
          <div class="record-view rounded vertical-spacer">
            <div ng-show="null == browser || badVersion">
              <div class="container-fluid bg-primary rounded-top"><h4>
                Incompatible Web Browser
              </h4></div>
              <div class="container-fluid form-body">
                <p class="text-warning">Your browser is not compatibile.</p>
                <hr />
                <p ng-if="null == browser">
                  Your web browser is not compatible with this application.
                  In order to log in you must use either Firefox or Chrome.
                  If you are seeing this message despite using one of the
                  supported browsers please contact support.
                </p>
                <p ng-if="badVersion">
                  Your {{ browser }} web browser is out of date (version {{badVersion}} detected).
                  In order to log in you must upgrade your web browser.
                </p>
              </div>
              <div class="form-footer rounded-bottom">
              </div>
            </div>
            <form ng-submit="login()"
                  ng-show="null != browser && !badVersion"
                  name="loginForm"
                  class="form-horizontal"
                  novalidate>
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
                  The credentials you provided are either invalid, do not exist or you do not have access to this
                  application, please try again.<br>
                  If this message persists then contact an administrator.
                </span>
                <span ng-if="'error' == state" class="help-block text-right has-feedback has-error">
                  There was a problem connecting to the authentication server, please try again.<br>
                  If this message persists then contact support and indicate that the authentication server
                  is not responding.
                </span>
              </div>
              <div class="form-footer text-right rounded-bottom bg-info">
                <button type="submit" class="btn btn-primary" ng-disabled="'processing' == state">Login</button>
              </div>
            </form>
          </div>
          <div ng-if="loginFooter" class="text-right" ng-bind-html="loginFooter"></div>
        </div>
      </div>
    </div>
    <div class="gradient-footer"></div>
  </div>
</body>
</html>
