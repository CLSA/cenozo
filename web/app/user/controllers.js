'use strict';

try { var user = angular.module( 'user' ); }
catch( err ) { var user = angular.module( 'user', [] ); }

/* ######################################################################################################## */
user.controller( 'UserAddCtrl', [
  '$scope', 'CnUserSingleton',
  function( $scope, CnUserSingleton ) {
    // use base class to create controller
    CnBaseAddCtrl.call( this, $scope, CnUserSingleton );
  }
] );

/* ######################################################################################################## */
user.controller( 'UserListCtrl', [
  '$scope', '$location', 'CnUserSingleton', 'CnModalRestrictFactory',
  function( $scope, $location, CnUserSingleton, CnModalRestrictFactory ) {
    CnBaseListCtrl.call( this, $scope, $location, CnUserSingleton, CnModalRestrictFactory );
  }
] );

/* ######################################################################################################## */
user.controller( 'UserViewCtrl', [
  '$scope', '$routeParams', 'CnUserSingleton',
  function( $scope, $routeParams, CnUserSingleton ) {
    CnBaseViewCtrl.call( this, $scope, CnUserSingleton );
    $scope.local.cnView.load( $routeParams.id );
  }
] );
