define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ActivityListCtrl', [
    '$scope', 'CnActivitySingleton',
    function( $scope, CnActivitySingleton ) {
      $scope.cnList = CnActivitySingleton.cnList;
      $scope.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
