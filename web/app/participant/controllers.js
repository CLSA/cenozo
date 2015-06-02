define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ParticipantListCtrl', [
    '$scope', 'CnParticipantModelFactory',
    function( $scope, CnParticipantModelFactory ) {
      $scope.model = CnParticipantModelFactory.root;
      $scope.model.listModel.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ParticipantViewCtrl', [
    '$scope', 'CnParticipantModelFactory',
    function( $scope, CnParticipantModelFactory ) {
      $scope.model = CnParticipantModelFactory.root;
      $scope.model.viewModel.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
