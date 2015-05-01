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
      $scope.model.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SystemMessageViewCtrl', [
    '$scope', 'CnSystemMessageModelFactory',
    function( $scope, CnSystemMessageModelFactory ) {
      $scope.model = CnSystemMessageModelFactory.root;
      $scope.model.cnView.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
