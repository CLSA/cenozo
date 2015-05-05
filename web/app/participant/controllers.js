define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ParticipantListCtrl', [
    '$scope', 'CnParticipantModelFactory',
    function( $scope, CnParticipantModelFactory ) {
      $scope.model = CnParticipantModelFactory.root;
      $scope.model.cnList.list().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ParticipantViewCtrl', [
    '$scope', 'CnParticipantModelFactory',
    function( $scope, CnParticipantModelFactory ) {
      $scope.model = CnParticipantModelFactory.root;
      $scope.model.promise.then( function() {
        $scope.model.cnView.view().catch( function exception() { cnFatalError(); } );
      } );
    }
  ] );

} );
