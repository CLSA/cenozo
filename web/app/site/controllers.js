'use strict';

try { var site = angular.module( 'site' ); }
catch( err ) { var site = angular.module( 'site', [] ); }

/* ######################################################################################################## */
site.controller( 'SiteAddCtrl', [
  '$scope', 'CnSiteSingleton',
  function( $scope, CnSiteSingleton ) {
    // use base class to create controller
    CnBaseAddCtrl.call(
      this,
      $scope,
      CnSiteSingleton,
      function createSiteRecord() {
        return {
          timezone: $scope.local.metadata.timezoneList[0]
        };
      }
    );
  }
] );

/* ######################################################################################################## */
site.controller( 'SiteListCtrl', [
  '$scope', '$location', 'CnSiteSingleton', 'CnModalRestrictFactory',
  function( $scope, $location, CnSiteSingleton, CnModalRestrictFactory ) {
    CnBaseListCtrl.call( this, $scope, $location, CnSiteSingleton, CnModalRestrictFactory );
  }
] );

/* ######################################################################################################## */
site.controller( 'SiteViewCtrl', [
  '$scope', '$routeParams', 'CnSiteSingleton',
  function( $scope, $routeParams, CnSiteSingleton ) {
    CnBaseViewCtrl.call( this, $scope, CnSiteSingleton );
    $scope.local.cnView.load( $routeParams.id );
  }
] );
