<!doctype html>
<html lang="en" ng-app="cenozoApp">
<head>
  <meta charset="utf-8">
  <title><?php echo ucwords( INSTANCE ); ?></title>
  <link rel="shortcut icon" href="img/favicon.ico">
  <link rel="stylesheet" href="<?php print LIB_URL; ?>/bootstrap/dist/css/bootstrap.css">
  <link rel="stylesheet" href="<?php print LIB_URL; ?>/angular-slider/slider.css">
  <link rel="stylesheet" href="<?php print CSS_URL; ?>/cenozo.css">

  <script src="<?php print LIB_URL; ?>/jquery/dist/jquery.js"></script>
  <script src="<?php print LIB_URL; ?>/bootstrap/dist/js/bootstrap.js"></script>
  <script src="<?php print LIB_URL; ?>/moment/moment.js"></script>
  <script src="<?php print LIB_URL; ?>/moment-timezone/builds/moment-timezone-with-data-2010-2020.js"></script>
  <script src="<?php print LIB_URL; ?>/angular/angular.js"></script>
  <script src="<?php print LIB_URL; ?>/angular-bootstrap/ui-bootstrap-tpls.js"></script>
  <script src="<?php print LIB_URL; ?>/angular-animate/angular-animate.js"></script>
  <script src="<?php print LIB_URL; ?>/angular-ui-router/release/angular-ui-router.js"></script>
  <script src="<?php print LIB_URL; ?>/angular-slider/slider.js"></script>

  <script src="<?php print CENOZO_URL; ?>/cenozo.js" id="cenozo"></script>
  <script src="<?php print LIB_URL; ?>/requirejs/require.js"
          data-main="<?php print APP_URL; ?>/require.js"></script>
</head>
<body class="background">
  <script>
    cenozo.modules( <?php print $framework_module_string; ?> );
    var cenozoApp = angular.module( 'cenozoApp', [
      'ui.bootstrap',
      'ui.router',
      'ui.slider',
      'cenozo'
    ] );
    cenozoApp.moduleList = <?php print $module_string; ?>;

    // pre-create snake, camel, title, etc strings for children and choosing lists
    for( var name in cenozoApp.moduleList ) {
      var module = cenozoApp.moduleList[name];
      for( var c = 0; c < module.children.length; c++ ) {
        module.children[c] = {
          snake: module.children[c],
          camel: module.children[c].snakeToCamel( false ),
          Camel: module.children[c].snakeToCamel( true ),
          title: module.children[c].replace( '_', ' ' ).ucWords()
        };
      }
      for( var c = 0; c < module.choosing.length; c++ ) {
        module.choosing[c] = {
          snake: module.choosing[c],
          camel: module.choosing[c].snakeToCamel( false ),
          Camel: module.choosing[c].snakeToCamel( true ),
          title: module.choosing[c].replace( '_', ' ' ).ucWords()
        };
      }
    }

    cenozoApp.config( [
      '$stateProvider',
      function( $stateProvider ) {
        for( var module in cenozoApp.moduleList ) {
          cenozo.routeModule( $stateProvider, module, cenozoApp.moduleList[module] );
        }
      }
    ] );

    cenozoApp.controller( 'MenuCtrl', [
      '$scope', '$state',
      function( $scope, $state ) {
        $scope.isCurrentState = function isCurrentState( state ) { return $state.is( state ); };
        $scope.lists = <?php print $list_item_string; ?>;
        $scope.utilities = <?php print $utility_item_string; ?>;
        $scope.reports = <?php print $report_item_string; ?>;
      }
    ] );
  </script>

  <div ng-controller="HeaderCtrl">
    <nav class="navigation-header navbar navbar-default noselect" ng-if="!isLoading">
      <div class="container-fluid">
        <!-- Brand and toggle get grouped for better mobile display -->
        <div class="navbar-header">
          <a class="navbar-brand dropdown-toggle" data-toggle="dropdown">{{ session.application.title }}</a>
          <ul class="dropdown-menu navigation-menu">
            <li ng-controller="MenuCtrl">
              <div class="container-fluid well" style="margin: -14px 7px 7px;">
                  <div class="btn-group col-sm-12">
                    <button class="btn btn-default col-sm-2"
                            ng-click="setSiteRole()"
                            tooltip="Change which site and role you are logged in as">Site/Role</button>
                    <button class="btn btn-default col-sm-2"
                            ng-click="setTimezone()"
                            tooltip="Change which timezone to display">Timezone</button>
                    <button class="btn btn-default col-sm-2"
                            ng-click="editAccount()"
                            tooltip="Edit your account details">Account</button>
                    <button class="btn btn-default col-sm-2"
                            ng-click="setPassword()"
                            tooltip="Change your password">Password</button>
                    <button class="btn btn-default col-sm-2"
                            ng-click="startBreak()"
                            tooltip="Go on break">Break</button>
                    <button class="btn btn-danger col-sm-2"
                            ng-click="logout()"
                            tooltip="Click and close window to logout the system">Logout</button>
                  </div>
              </div>
              <div class="container-fluid row">
                <ul class="navigation-group col-xs-4">
                  <li class="container-fluid bg-primary rounded-top">
                    <h4 class="text-center">Lists</h4>
                  </li>
                  <li ng-repeat="(module,title) in lists">
                    <a class="btn btn-default btn-default full-width"
                       ng-class="{ 'no-rounding': !$last, 'rounded-bottom': $last }"
                       ui-sref="{{ module }}.list">{{ title }}</a>
                  </li>
                </ul>
                <ul class="navigation-group col-xs-4">
                  <li class="container-fluid bg-primary rounded-top">
                    <h4 class="text-center">Utilities</h4>
                  </li>
                  <li ng-repeat="(module,title) in utilities">
                    <a class="btn btn-default btn-default full-width"
                       ng-class="{ 'no-rounding': !$last, 'rounded-bottom': $last }"
                       ui-sref="{{ module }}.list">{{ title }}</a>
                  </li>
                </ul>
                <ul class="navigation-group col-xs-4">
                  <li class="container-fluid bg-primary rounded-top">
                    <h4 class="text-center">Reports</h4>
                  </li>
                  <li ng-repeat="(module,title) in reports">
                    <a class="btn btn-default btn-default full-width"
                       ng-class="{ 'no-rounding': !$last, 'rounded-bottom': $last }"
                       ui-sref="{{ module }}.list">{{ title }}</a>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
          <button type="button"
                  class="navbar-toggle collapsed"
                  data-toggle="collapse"
                  data-target="#navbar-collapse">
            <span class="sr-only">Toggle navigation</span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </button>
        </div>
        <div class="collapse navbar-collapse" id="navbar-collapse">
          <ul class="nav navbar-nav">
            <ul class="breadcrumb">
              <li ng-repeat="breadcrumb in session.breadcrumbTrail"
                  ng-class="{ 'navbar-link': !$last, 'active': $last }"
                  ng-click="breadcrumb.go()">{{ breadcrumb.title }}
              </li>
            </ul>
          </ul>
          <ul class="nav navbar-nav navbar-right">
            <li>
              <p class="navbar-text">
                <span ng-click="setSiteRole()">{{ session.role.name | cnUCWords }} @ {{ session.site.name }}</span>
                <span ng-click="setTimezone()"><i class="glyphicon glyphicon-time"></i> {{ session.time }}</span>
              </p>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  </div>

  <div id="view" ui-view class="container-fluid outer-view-frame fade-transition noselect"></div>
</body>
</html>
