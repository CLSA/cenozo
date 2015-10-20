define( [], function() { 
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ConsentTypeListCtrl', [
    '$scope', 'CnConsentTypeModelFactory', 'CnSession',
    function( $scope, CnConsentTypeModelFactory, CnSession ) {
      $scope.model = CnConsentTypeModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ConsentTypeViewCtrl', [
    '$scope', 'CnConsentTypeModelFactory', 'CnSession',
    function( $scope, CnConsentTypeModelFactory, CnSession ) { 
      $scope.model = CnConsentTypeModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }   
  ] );

} );
