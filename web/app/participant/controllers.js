define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ParticipantListCtrl', [
    '$scope', 'CnParticipantModelFactory', 'CnSession',
    function( $scope, CnParticipantModelFactory, CnSession ) {
      $scope.model = CnParticipantModelFactory.root;
      $scope.model.listModel.onList().then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ParticipantViewCtrl', [
    '$scope', 'CnParticipantModelFactory', 'CnSession',
    function( $scope, CnParticipantModelFactory, CnSession ) {
      $scope.model = CnParticipantModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

} );
