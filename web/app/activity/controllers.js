define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ActivityListCtrl', [
    '$scope', 'CnActivityModelFactory',
    function( $scope, CnActivityModelFactory ) {
      $scope.model = CnActivityModelFactory.root;
      $scope.model.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
