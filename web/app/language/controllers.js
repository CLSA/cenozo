define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'LanguageListCtrl', [
    '$scope', 'CnLanguageModelFactory', 'CnSession',
    function( $scope, CnLanguageModelFactory, CnSession ) {
      $scope.model = CnLanguageModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'LanguageViewCtrl', [
    '$scope', 'CnLanguageModelFactory', 'CnSession',
    function( $scope, CnLanguageModelFactory, CnSession ) {
      $scope.model = CnLanguageModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

} );
