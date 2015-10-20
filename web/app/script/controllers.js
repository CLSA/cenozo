define( [], function() { 
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ScriptAddCtrl', [
    '$scope', 'CnScriptModelFactory', 'CnSession',
    function( $scope, CnScriptModelFactory, CnSession ) {
      $scope.model = CnScriptModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ScriptListCtrl', [
    '$scope', 'CnScriptModelFactory', 'CnSession',
    function( $scope, CnScriptModelFactory, CnSession ) {
      $scope.model = CnScriptModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ScriptViewCtrl', [
    '$scope', 'CnScriptModelFactory', 'CnSession',
    function( $scope, CnScriptModelFactory, CnSession ) {
      $scope.model = CnScriptModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

} );
