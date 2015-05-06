define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'PhoneAddCtrl', [
    '$scope', 'CnPhoneModelFactory',
    function( $scope, CnPhoneModelFactory ) {
      $scope.model = CnPhoneModelFactory.root;
      $scope.record = $scope.model.cnAdd.onNew();
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'PhoneListCtrl', [
    '$scope', 'CnPhoneModelFactory',
    function( $scope, CnPhoneModelFactory ) {
      $scope.model = CnPhoneModelFactory.root;
      $scope.model.cnList.onList().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'PhoneViewCtrl', [
    '$scope', 'CnPhoneModelFactory',
    function( $scope, CnPhoneModelFactory ) {
      $scope.model = CnPhoneModelFactory.root;
      $scope.model.cnView.onView().catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
