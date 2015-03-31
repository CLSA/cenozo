define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ParticipantAddCtrl', [
    '$scope', 'CnParticipantSingleton',
    function( $scope, CnParticipantSingleton ) {
      $scope.cnAdd = CnParticipantSingleton.cnAdd;
      $scope.cnList = CnParticipantSingleton.cnList;
      $scope.record = $scope.cnAdd.createRecord();
    }
  ] );

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
      $scope.cnView.load( $stateParams.id ).catch( function exception() { cnFatalError(); } );
      $scope.patch = cnPatch( $scope );
    }
  ] );

} );
