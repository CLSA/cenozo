define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ParticipantListCtrl', [
    '$scope', 'CnParticipantSingleton',
    function( $scope, CnParticipantSingleton ) {
      $scope.cnList = CnParticipantSingleton.cnList;
      $scope.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ParticipantViewCtrl', [
    '$stateParams', '$scope', 'CnParticipantSingleton',
    function( $stateParams, $scope, CnParticipantSingleton ) {
      $scope.cnList = CnParticipantSingleton.cnList;
      $scope.cnView = CnParticipantSingleton.cnView;
      CnParticipantSingleton.promise.then( function() {
        $scope.cnView.load( $stateParams.id ).catch( function exception() { cnFatalError(); } );
      } );
    }
  ] );

} );
