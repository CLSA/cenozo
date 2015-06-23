define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'CollectionAddCtrl', [
    '$scope', 'CnCollectionModelFactory', 'CnSession',
    function( $scope, CnCollectionModelFactory, CnSession ) {
      $scope.model = CnCollectionModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'CollectionListCtrl', [
    '$scope', 'CnCollectionModelFactory', 'CnSession',
    function( $scope, CnCollectionModelFactory, CnSession ) {
      $scope.model = CnCollectionModelFactory.root;
      $scope.model.listModel.onList().then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'CollectionViewCtrl', [
    '$scope', 'CnCollectionModelFactory', 'CnSession',
    function( $scope, CnCollectionModelFactory, CnSession ) {
      $scope.model = CnCollectionModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );

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
