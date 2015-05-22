define( [], function() {

  'use strict';
  var cenozo = angular.module( 'cenozo' );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'LanguageListCtrl', [
    '$scope', 'CnLanguageModelFactory',
    function( $scope, CnLanguageModelFactory ) {
      $scope.model = CnLanguageModelFactory.root;
      $scope.model.cnList.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'LanguageViewCtrl', [
    '$scope', 'CnLanguageModelFactory',
    function( $scope, CnLanguageModelFactory ) {
      $scope.model = CnLanguageModelFactory.root;
      $scope.model.cnView.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
