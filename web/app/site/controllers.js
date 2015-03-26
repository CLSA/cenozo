define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SiteAddCtrl', [
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
  cnCachedProviders.controller( 'SiteListCtrl', [
    '$scope', '$location', 'CnSiteSingleton', 'CnModalRestrictFactory',
    function( $scope, $location, CnSiteSingleton, CnModalRestrictFactory ) {
      CnBaseListCtrl.call( this, $scope, $location, CnSiteSingleton, CnModalRestrictFactory );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SiteViewCtrl', [
    '$scope', '$stateParams', 'CnSiteSingleton',
    function( $scope, $stateParams, CnSiteSingleton ) {
      CnBaseViewCtrl.call( this, $scope, CnSiteSingleton );
      $scope.local.cnView.load( $stateParams.id );
    }
  ] );

} );
