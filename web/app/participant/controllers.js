define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ParticipantListCtrl', [
    '$scope', 'CnParticipantModelFactory',
    function( $scope, CnParticipantModelFactory ) {
      $scope.model = CnParticipantModelFactory.root;
      $scope.model.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ParticipantViewCtrl', [
    '$scope', 'CnParticipantModelFactory',
    function( $scope, CnParticipantModelFactory ) {
      $scope.model = CnParticipantModelFactory.root;
      $scope.model.promise.then( function() {
        $scope.model.cnView.load().catch( function exception() { cnFatalError(); } );
      } );
    }
  ] );

} );
