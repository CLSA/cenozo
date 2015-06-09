define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'LanguageListCtrl', [
    '$scope', 'CnLanguageModelFactory',
    function( $scope, CnLanguageModelFactory ) {
      $scope.model = CnLanguageModelFactory.root;
      $scope.model.listModel.onList().then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'LanguageViewCtrl', [
    '$scope', 'CnLanguageModelFactory',
    function( $scope, CnLanguageModelFactory ) {
      $scope.model = CnLanguageModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
