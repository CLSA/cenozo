define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SystemMessageAddCtrl', [
    '$scope', 'CnSystemMessageModelFactory',
    function( $scope, CnSystemMessageModelFactory ) {
      $scope.model = CnSystemMessageModelFactory.root;
      $scope.model.promise.then( function() { $scope.record = $scope.model.cnAdd.createRecord(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SystemMessageListCtrl', [
    '$scope', 'CnSystemMessageModelFactory',
    function( $scope, CnSystemMessageModelFactory ) {
      $scope.model = CnSystemMessageModelFactory.root;
      $scope.model.cnList.onList().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SystemMessageViewCtrl', [
    '$scope', 'CnSystemMessageModelFactory',
    function( $scope, CnSystemMessageModelFactory ) {
      $scope.model = CnSystemMessageModelFactory.root;
      $scope.model.cnView.onView().catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
