define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SystemMessageAddCtrl', [
    '$scope', '$state', 'CnSystemMessageSingleton',
    function( $scope, $state, CnSystemMessageSingleton ) {
      CnBaseAddCtrl.call( this, $scope, CnSystemMessageSingleton );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SystemMessageListCtrl', [
    '$scope', '$state', 'CnSystemMessageSingleton', 'CnModalRestrictFactory',
    function( $scope, $state, CnSystemMessageSingleton, CnModalRestrictFactory ) {
      CnBaseListCtrl.call( this, $scope, $state, CnSystemMessageSingleton, CnModalRestrictFactory );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SystemMessageViewCtrl', [
    '$scope', '$state', '$stateParams', 'CnSystemMessageSingleton',
    function( $scope, $state, $stateParams, CnSystemMessageSingleton ) {
      CnBaseViewCtrl.call( this, $scope, $state, CnSystemMessageSingleton );
      $scope.local.cnView.load( $stateParams.id );
    }
  ] );

} );
