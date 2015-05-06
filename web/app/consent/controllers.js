define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ConsentAddCtrl', [
    '$scope', 'CnConsentModelFactory',
    function( $scope, CnConsentModelFactory ) {
      $scope.model = CnConsentModelFactory.root;
      $scope.record = {};
      $scope.model.cnAdd.onNew( $scope.record ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ConsentListCtrl', [
    '$scope', 'CnConsentModelFactory',
    function( $scope, CnConsentModelFactory ) {
      $scope.model = CnConsentModelFactory.root;
      $scope.model.cnList.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ConsentViewCtrl', [
    '$scope', 'CnConsentModelFactory',
    function( $scope, CnConsentModelFactory ) {
      $scope.model = CnConsentModelFactory.root;
      $scope.model.cnView.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
