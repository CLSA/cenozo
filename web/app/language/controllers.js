define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'LanguageListCtrl', [
    '$scope', 'CnLanguageModelFactory',
    function( $scope, CnLanguageModelFactory ) {
      $scope.model = CnLanguageModelFactory.root;
      $scope.model.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'LanguageViewCtrl', [
    '$scope', 'CnLanguageModelFactory',
    function( $scope, CnLanguageModelFactory ) {
      $scope.model = CnLanguageModelFactory.root;
      $scope.model.cnView.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
