define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'UserAddCtrl', [
    '$scope', '$state', 'CnUserSingleton',
    function( $scope, $state, CnUserSingleton ) {
      CnBaseAddCtrl.call( this, $scope, CnUserSingleton );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'UserListCtrl', [
    '$scope', '$state', 'CnUserSingleton', 'CnModalRestrictFactory',
    function( $scope, $state, CnUserSingleton, CnModalRestrictFactory ) {
      CnBaseListCtrl.call( this, $scope, $state, CnUserSingleton, CnModalRestrictFactory );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'UserViewCtrl', [
    '$scope', '$state', '$stateParams', 'CnUserSingleton',
    function( $scope, $state, $stateParams, CnUserSingleton ) {
      CnBaseViewCtrl.call( this, $scope, $state, CnUserSingleton );
      $scope.local.cnView.load( $stateParams.id );
    }
  ] );

} );
