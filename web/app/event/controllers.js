define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'EventAddCtrl', [
    '$scope', 'CnEventModelFactory',
    function( $scope, CnEventModelFactory ) {
      $scope.model = CnEventModelFactory.root;
      $scope.record = $scope.model.cnAdd.onNew();
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'EventListCtrl', [
    '$scope', 'CnEventModelFactory',
    function( $scope, CnEventModelFactory ) {
      $scope.model = CnEventModelFactory.root;
      $scope.model.cnList.onList().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'EventViewCtrl', [
    '$scope', 'CnEventModelFactory',
    function( $scope, CnEventModelFactory ) {
      $scope.model = CnEventModelFactory.root;
      $scope.model.cnView.onView().catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
