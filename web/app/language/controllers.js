define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'LanguageListCtrl', [
    '$scope', 'CnLanguageModelFactory',
    function( $scope, CnLanguageModelFactory ) {
      $scope.model = CnLanguageModelFactory.root;
      $scope.model.cnList.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'LanguageViewCtrl', [
    '$scope', 'CnLanguageModelFactory',
    function( $scope, CnLanguageModelFactory ) {
      $scope.model = CnLanguageModelFactory.root;
      $scope.model.cnView.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
