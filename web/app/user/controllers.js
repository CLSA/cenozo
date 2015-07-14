define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'UserAddCtrl', [
    '$scope', 'CnUserModelFactory', 'CnSession',
    function( $scope, CnUserModelFactory, CnSession ) {
      $scope.model = CnUserModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'UserListCtrl', [
    '$scope', 'CnUserModelFactory', 'CnSession',
    function( $scope, CnUserModelFactory, CnSession ) {
      $scope.model = CnUserModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'UserViewCtrl', [
    '$scope', 'CnUserModelFactory', 'CnSession',
    function( $scope, CnUserModelFactory, CnSession ) {
      $scope.model = CnUserModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );

      // when leaving...
      $scope.$on( '$stateChangeStart', function( event, toState, toParams, fromState, fromParams ) {
        // turn off the language list choose mode if it is on
        if( $scope.model.viewModel.languageModel.listModel.chooseMode )
          $scope.model.viewModel.languageModel.listModel.toggleChooseMode();
      } );
    }
  ] );

} );
