define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'QuotaAddCtrl', [
    '$scope', 'CnQuotaSingleton',
    function( $scope, CnQuotaSingleton ) {
      // use base class to create controller
      CnBaseAddCtrl.call( this, $scope, CnQuotaSingleton );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'QuotaListCtrl', [
    '$scope', '$location', 'CnQuotaSingleton', 'CnModalRestrictFactory',
    function( $scope, $location, CnQuotaSingleton, CnModalRestrictFactory ) {
      CnBaseListCtrl.call( this, $scope, $location, CnQuotaSingleton, CnModalRestrictFactory );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'QuotaViewCtrl', [
    '$scope', '$stateParams', 'CnQuotaSingleton',
    function( $scope, $stateParams, CnQuotaSingleton ) {
      CnBaseViewCtrl.call( this, $scope, CnQuotaSingleton );
      $scope.local.cnView.load( $stateParams.id );
    }
  ] );

} );
