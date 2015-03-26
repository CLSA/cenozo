define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'UserAddCtrl', [
    '$scope', 'CnUserSingleton',
    function( $scope, CnUserSingleton ) {
      // use base class to create controller
      CnBaseAddCtrl.call( this, $scope, CnUserSingleton );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'UserListCtrl', [
    '$scope', '$location', 'CnUserSingleton', 'CnModalRestrictFactory',
    function( $scope, $location, CnUserSingleton, CnModalRestrictFactory ) {
      CnBaseListCtrl.call( this, $scope, $location, CnUserSingleton, CnModalRestrictFactory );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'UserViewCtrl', [
    '$scope', '$stateParams', 'CnUserSingleton',
    function( $scope, $stateParams, CnUserSingleton ) {
      CnBaseViewCtrl.call( this, $scope, CnUserSingleton );
      $scope.local.cnView.load( $stateParams.id );
    }
  ] );

} );
