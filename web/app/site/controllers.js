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
  '$scope', 'CnSiteSingleton', 'CnModalRestrictFactory',
  function( $scope, CnSiteSingleton, CnModalRestrictFactory ) {
    CnBaseListCtrl.call( this, $scope, CnSiteSingleton, CnModalRestrictFactory );
  }
] );

/* ######################################################################################################## */
site.controller( 'SiteViewCtrl', [
  '$scope', 'CnSiteSingleton',
  function( $scope, CnSiteSingleton ) {
    CnBaseViewCtrl.call( this, $scope, CnSiteSingleton );
  }
] );
