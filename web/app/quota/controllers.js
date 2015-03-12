'use strict';

try { var quota = angular.module( 'quota' ); }
catch( err ) { var quota = angular.module( 'quota', [] ); }

/* ######################################################################################################## */
quota.controller( 'QuotaAddCtrl', [
  '$scope', 'CnQuotaSingleton',
  function( $scope, CnQuotaSingleton ) {
    // use base class to create controller
    CnBaseAddCtrl.call( this, $scope, CnQuotaSingleton );
  }
] );

/* ######################################################################################################## */
quota.controller( 'QuotaListCtrl', [
  '$scope', '$location', 'CnQuotaSingleton', 'CnModalRestrictFactory',
  function( $scope, $location, CnQuotaSingleton, CnModalRestrictFactory ) {
    CnBaseListCtrl.call( this, $scope, $location, CnQuotaSingleton, CnModalRestrictFactory );
  }
] );

/* ######################################################################################################## */
quota.controller( 'QuotaViewCtrl', [
  '$scope', '$routeParams', 'CnQuotaSingleton',
  function( $scope, $routeParams, CnQuotaSingleton ) {
    CnBaseViewCtrl.call( this, $scope, CnQuotaSingleton );
    $scope.local.cnView.load( $routeParams.id );
  }
] );
