define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SystemMessageAddCtrl', [
    '$scope', 'CnSystemMessageSingleton',
    function( $scope, CnSystemMessageSingleton ) {
      // use base class to create controller
      CnBaseAddCtrl.call( this, $scope, CnSystemMessageSingleton );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SystemMessageListCtrl', [
    '$scope', '$location', 'CnSystemMessageSingleton', 'CnModalRestrictFactory',
    function( $scope, $location, CnSystemMessageSingleton, CnModalRestrictFactory ) {
      CnBaseListCtrl.call( this, $scope, $location, CnSystemMessageSingleton, CnModalRestrictFactory );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SystemMessageViewCtrl', [
    '$scope', '$stateParams', 'CnSystemMessageSingleton',
    function( $scope, $stateParams, CnSystemMessageSingleton ) {
      CnBaseViewCtrl.call( this, $scope, CnSystemMessageSingleton );
      $scope.local.cnView.load( $stateParams.id );
    }
  ] );

} );
