'use strict';

try { var region_site = angular.module( 'region_site' ); }
catch( err ) { var region_site = angular.module( 'region_site', [] ); }

/* ######################################################################################################## */
region_site.controller( 'RegionSiteAddCtrl', [
  '$scope', 'CnRegionSiteSingleton',
  function( $scope, CnRegionSiteSingleton ) {
    // use base class to create controller
    CnBaseAddCtrl.call( this, $scope, CnRegionSiteSingleton );
  }
] );

/* ######################################################################################################## */
region_site.controller( 'RegionSiteListCtrl', [
  '$scope', '$location', 'CnRegionSiteSingleton', 'CnModalRestrictFactory',
  function( $scope, $location, CnRegionSiteSingleton, CnModalRestrictFactory ) {
    CnBaseListCtrl.call( this, $scope, $location, CnRegionSiteSingleton, CnModalRestrictFactory );
  }
] );

/* ######################################################################################################## */
region_site.controller( 'RegionSiteViewCtrl', [
  '$scope', '$routeParams', 'CnRegionSiteSingleton',
  function( $scope, $routeParams, CnRegionSiteSingleton ) {
    CnBaseViewCtrl.call( this, $scope, CnRegionSiteSingleton );
    $scope.local.cnView.load( $routeParams.id );
  }
] );
