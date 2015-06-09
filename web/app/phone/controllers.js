define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'PhoneAddCtrl', [
    '$scope', 'CnPhoneModelFactory',
    function( $scope, CnPhoneModelFactory ) {
      $scope.model = CnPhoneModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'PhoneListCtrl', [
    '$scope', 'CnPhoneModelFactory',
    function( $scope, CnPhoneModelFactory ) {
      $scope.model = CnPhoneModelFactory.root;
      $scope.model.listModel.onList().then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'PhoneViewCtrl', [
    '$scope', 'CnPhoneModelFactory',
    function( $scope, CnPhoneModelFactory ) {
      $scope.model = CnPhoneModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
