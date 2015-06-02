define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'SystemMessageAddCtrl', [
    '$scope', 'CnSystemMessageModelFactory',
    function( $scope, CnSystemMessageModelFactory ) {
      $scope.model = CnSystemMessageModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'SystemMessageListCtrl', [
    '$scope', 'CnSystemMessageModelFactory',
    function( $scope, CnSystemMessageModelFactory ) {
      $scope.model = CnSystemMessageModelFactory.root;
      $scope.model.listModel.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'SystemMessageViewCtrl', [
    '$scope', 'CnSystemMessageModelFactory',
    function( $scope, CnSystemMessageModelFactory ) {
      $scope.model = CnSystemMessageModelFactory.root;
      $scope.model.viewModel.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
