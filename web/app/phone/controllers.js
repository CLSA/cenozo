define( [], function() {

  'use strict';
  var cenozo = angular.module( 'cenozo' );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'PhoneAddCtrl', [
    '$scope', 'CnPhoneModelFactory',
    function( $scope, CnPhoneModelFactory ) {
      $scope.model = CnPhoneModelFactory.root;
      $scope.record = {};
      $scope.model.cnAdd.onNew( $scope.record ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'PhoneListCtrl', [
    '$scope', 'CnPhoneModelFactory',
    function( $scope, CnPhoneModelFactory ) {
      $scope.model = CnPhoneModelFactory.root;
      $scope.model.cnList.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'PhoneViewCtrl', [
    '$scope', 'CnPhoneModelFactory',
    function( $scope, CnPhoneModelFactory ) {
      $scope.model = CnPhoneModelFactory.root;
      $scope.model.cnView.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
