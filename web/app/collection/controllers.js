define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'CollectionAddCtrl', [
    '$scope', 'CnCollectionModelFactory',
    function( $scope, CnCollectionModelFactory ) {
      $scope.model = CnCollectionModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'CollectionListCtrl', [
    '$scope', 'CnCollectionModelFactory',
    function( $scope, CnCollectionModelFactory ) {
      $scope.model = CnCollectionModelFactory.root;
      $scope.model.listModel.onList().then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'CollectionViewCtrl', [
    '$scope', 'CnCollectionModelFactory',
    function( $scope, CnCollectionModelFactory ) {
      $scope.model = CnCollectionModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );

      // when leaving...
      $scope.$on( '$stateChangeStart', function( event, toState, toParams, fromState, fromParams ) {
        // turn off the participant and user list choose mode if they are on
        if( $scope.model.viewModel.participantModel.listModel.chooseMode )
          $scope.model.viewModel.participantModel.listModel.toggleChooseMode();
        if( $scope.model.viewModel.userModel.listModel.chooseMode )
          $scope.model.viewModel.userModel.listModel.toggleChooseMode();
      } );
    }
  ] );

} );
