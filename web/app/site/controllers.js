define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SiteAddCtrl', [
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
  cnCachedProviders.controller( 'SiteListCtrl', [
    '$scope', 'CnSiteModelFactory',
    function( $scope, CnSiteModelFactory ) {
      $scope.model = CnSiteModelFactory.root;
      $scope.model.cnList.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'SiteViewCtrl', [
    '$scope', 'CnSiteModelFactory',
    function( $scope, CnSiteModelFactory ) {
      $scope.model = CnSiteModelFactory.root;
      $scope.model.cnView.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
