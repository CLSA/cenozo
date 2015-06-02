<!doctype html>
<html lang="en" ng-app="cenozoApp">
<head>
  <meta charset="utf-8">
  <title><?php print INSTANCE; ?></title>
  <link rel="shortcut icon" href="img/favicon.ico">
  <link rel="stylesheet" href="<?php print LIB_URL; ?>/bootstrap/dist/css/bootstrap.css">
  <link rel="stylesheet" href="<?php print LIB_URL; ?>/angular-snap/angular-snap.css">
  <link rel="stylesheet" href="<?php print LIB_URL; ?>/angular-slider/slider.css">
  <link rel="stylesheet" href="<?php print CSS_URL; ?>/cenozo.css">

  <script src="<?php print LIB_URL; ?>/jquery/dist/jquery.js"></script>
  <script src="<?php print LIB_URL; ?>/bootstrap/dist/js/bootstrap.js"></script>
  <script src="<?php print LIB_URL; ?>/moment/moment.js"></script>
  <script src="<?php print LIB_URL; ?>/moment-timezone/builds/moment-timezone-with-data-2010-2020.js"></script>
  <script src="<?php print LIB_URL; ?>/snapjs/snap.js"></script>
  <script src="<?php print LIB_URL; ?>/angular/angular.js"></script>
  <script src="<?php print LIB_URL; ?>/angular-bootstrap/ui-bootstrap-tpls.js"></script>
  <script src="<?php print LIB_URL; ?>/angular-animate/angular-animate.js"></script>
  <script src="<?php print LIB_URL; ?>/angular-ui-router/release/angular-ui-router.js"></script>
  <script src="<?php print LIB_URL; ?>/angular-slider/slider.js"></script>
  <script src="<?php print LIB_URL; ?>/angular-snap/angular-snap.js"></script>

  <script src="<?php print CENOZO_URL; ?>/cenozo.js" id="cenozo"></script>
  <script src="<?php print LIB_URL; ?>/requirejs/require.js"
          data-main="<?php print APP_URL; ?>/require.js"></script>
</head>
<body>
  <script>
    cenozo.modules( <?php print $framework_module_string; ?> );
    var cenozoApp = angular.module( 'cenozoApp', [
      'ui.bootstrap',
      'ui.router',
      'ui.slider',
      'snap',
      'cenozo'
    ] );
    cenozoApp.moduleList = <?php print $module_string; ?>;

    cenozoApp.config( [
      '$stateProvider',
      function( $stateProvider ) {
        for( var module in cenozoApp.moduleList ) {
          cenozo.routeModule( $stateProvider, module, cenozoApp.moduleList[module] );
        }
      }
    ] );

    cenozoApp.controller( 'CnMenuCtrl', [
      '$scope', '$state',
      function( $scope, $state ) {
        $scope.isCurrentState = function isCurrentState( state ) { return $state.is( state ); };
        $scope.lists = <?php print $list_item_string; ?>;
        $scope.utilities = <?php print $utility_item_string; ?>;
        $scope.reports = <?php print $report_item_string; ?>;
      }
    ] );
  </script>

  <div class="span-drawers">
    <div class="snap-drawer snap-drawer-left" ng-controller="CnMenuCtrl">
      <accordion close-others="true">
        <accordion-group ng-init="isOpen = true" is-open="isOpen">
          <accordion-heading>
            <button class="btn btn-primary btn-accordion full-width">Lists</button>
          </accordion-heading>
          <div class="btn-group-vertical full-width" role="group">
            <a class="btn btn-default"
               ng-repeat="(module,title) in lists"
               ng-class="{ 'btn-info': isCurrentState( module ) }"
               ui-sref="{{ module }}.list"
               snap-close>{{ title }}</a>
          </div>
        </accordion-group>
        <accordion-group>
          <accordion-heading>
            <button class="btn btn-primary btn-accordion full-width">Utilities</button>
          </accordion-heading>
          <div class="btn-group-vertical full-width" role="group">
            <a class="btn btn-default"
               ng-repeat="(module,title) in utilities"
               ng-class="{ 'btn-info': isCurrentState( module ) }"
               ui-sref="{{ module }}"
               snap-close>{{ title }}</a>
          </div>
        </accordion-group>
        <accordion-group>
          <accordion-heading>
            <button class="btn btn-primary btn-accordion full-width">Report</button>
          </accordion-heading>
          <div class="btn-group-vertical full-width" role="group">
            <a class="btn btn-default"
               ng-repeat="(module,title) in reports"
               ng-class="{ 'btn-info': isCurrentState( module ) }"
               ui-sref="{{ module }}"
               snap-close>{{ title }}</a>
          </div>
        </accordion-group>
      </accordion>
    </div>
  </div>

  <snap-content snap-opt-tap-to-close="true" snap-opt-disable="'right'" snap-opt-hyperextensible="false">
    <button snap-toggle="left" class="btn btn-primary menu-button rounded-right">
      <i class="glyphicon glyphicon-align-justify" aria-hidden="true"></i>
    </button>
    <div class="container-fluid bg-info nopadding row app-heading noselect">
        <div class="col-xs-3 app-heading-title">
          <cn-application-title></cn-application-title>
        </div>
        <div class="col-xs-5 app-heading-shortcuts">
          <cn-clock></cn-clock>
          <cn-toolbelt></cn-toolbelt>
        </div>
        <div class="col-xs-4 app-heading-state">
          <cn-site-role-switcher></cn-site-role-switcher>
        </div>
    </div>
    <div ui-view class="container-fluid outer-view-frame fade-transition noselect"></div>
  </snap-content>
</body>
</html>
