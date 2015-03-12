'use strict';

try { var system_message = angular.module( 'system_message' ); }
catch( err ) { var system_message = angular.module( 'system_message', [] ); }

/* ######################################################################################################## */
system_message.controller( 'SystemMessageAddCtrl', [
  '$scope', 'CnSystemMessageSingleton',
  function( $scope, CnSystemMessageSingleton ) {
    // use base class to create controller
    CnBaseAddCtrl.call( this, $scope, CnSystemMessageSingleton );
  }
] );

/* ######################################################################################################## */
system_message.controller( 'SystemMessageListCtrl', [
  '$scope', '$location', 'CnSystemMessageSingleton', 'CnModalRestrictFactory',
  function( $scope, $location, CnSystemMessageSingleton, CnModalRestrictFactory ) {
    CnBaseListCtrl.call( this, $scope, $location, CnSystemMessageSingleton, CnModalRestrictFactory );
  }
] );

/* ######################################################################################################## */
system_message.controller( 'SystemMessageViewCtrl', [
  '$scope', '$routeParams', 'CnSystemMessageSingleton',
  function( $scope, $routeParams, CnSystemMessageSingleton ) {
    CnBaseViewCtrl.call( this, $scope, CnSystemMessageSingleton );
    $scope.local.cnView.load( $routeParams.id );
  }
] );
