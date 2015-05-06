define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ConsentAddCtrl', [
    '$scope', 'CnConsentModelFactory',
    function( $scope, CnConsentModelFactory ) {
      $scope.model = CnConsentModelFactory.root;
      $scope.model.promise.then( function() { $scope.record = $scope.model.cnAdd.createRecord(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ConsentListCtrl', [
    '$scope', 'CnConsentModelFactory',
    function( $scope, CnConsentModelFactory ) {
      $scope.model = CnConsentModelFactory.root;
      $scope.model.cnList.onList().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ConsentViewCtrl', [
    '$scope', 'CnConsentModelFactory',
    function( $scope, CnConsentModelFactory ) {
      $scope.model = CnConsentModelFactory.root;
      $scope.model.cnView.onView().catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
