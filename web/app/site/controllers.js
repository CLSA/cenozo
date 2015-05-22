define( [], function() {

  'use strict';
  var cenozo = angular.module( 'cenozo' );

  /* ######################################################################################################## */
  cenozo.providerscontroller( 'SiteAddCtrl', [
    '$scope', 'CnSiteModelFactory',
    function( $scope, CnSiteModelFactory ) {
      $scope.model = CnSiteModelFactory.root;
      $scope.record = {};
      $scope.model.cnAdd.onNew( $scope.record ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providerscontroller( 'SiteListCtrl', [
    '$scope', 'CnSiteModelFactory',
    function( $scope, CnSiteModelFactory ) {
      $scope.model = CnSiteModelFactory.root;
      $scope.model.cnList.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providerscontroller( 'SiteViewCtrl', [
    '$scope', 'CnSiteModelFactory',
    function( $scope, CnSiteModelFactory ) {
      $scope.model = CnSiteModelFactory.root;
      $scope.model.cnView.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
