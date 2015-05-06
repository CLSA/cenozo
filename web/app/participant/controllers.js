define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ParticipantListCtrl', [
    '$scope', 'CnParticipantModelFactory',
    function( $scope, CnParticipantModelFactory ) {
      $scope.model = CnParticipantModelFactory.root;
      $scope.model.cnList.onList().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ParticipantViewCtrl', [
    '$scope', 'CnParticipantModelFactory',
    function( $scope, CnParticipantModelFactory ) {
      $scope.model = CnParticipantModelFactory.root;
      $scope.model.cnView.onView().catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
