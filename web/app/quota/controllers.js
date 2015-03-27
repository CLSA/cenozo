define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'QuotaAddCtrl', [
    '$scope', '$state', 'CnQuotaSingleton',
    function( $scope, $state, CnQuotaSingleton ) {
      CnBaseAddCtrl.call( this, $scope, CnQuotaSingleton );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'QuotaListCtrl', [
    '$scope', '$state', 'CnQuotaSingleton', 'CnModalRestrictFactory',
    function( $scope, $state, CnQuotaSingleton, CnModalRestrictFactory ) {
      CnBaseListCtrl.call( this, $scope, $state, CnQuotaSingleton, CnModalRestrictFactory );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'QuotaViewCtrl', [
    '$scope', '$state', '$stateParams', 'CnQuotaSingleton',
    function( $scope, $state, $stateParams, CnQuotaSingleton ) {
      CnBaseViewCtrl.call( this, $scope, $state, CnQuotaSingleton );
      $scope.local.cnView.load( $stateParams.id );
    }
  ] );

} );
