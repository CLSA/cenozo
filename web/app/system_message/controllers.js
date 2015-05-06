define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SystemMessageAddCtrl', [
    '$scope', 'CnSystemMessageModelFactory',
    function( $scope, CnSystemMessageModelFactory ) {
      $scope.model = CnSystemMessageModelFactory.root;
      $scope.record = {};
      $scope.model.cnAdd.onNew( $scope.record ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SystemMessageListCtrl', [
    '$scope', 'CnSystemMessageModelFactory',
    function( $scope, CnSystemMessageModelFactory ) {
      $scope.model = CnSystemMessageModelFactory.root;
      $scope.model.cnList.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SystemMessageViewCtrl', [
    '$scope', 'CnSystemMessageModelFactory',
    function( $scope, CnSystemMessageModelFactory ) {
      $scope.model = CnSystemMessageModelFactory.root;
      $scope.model.cnView.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
