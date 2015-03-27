define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ParticipantAddCtrl', [
    '$scope', '$state', 'CnParticipantSingleton',
    function( $scope, $state, CnParticipantSingleton ) {
      CnBaseAddCtrl.call( this, $scope, $state, CnParticipantSingleton );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ParticipantListCtrl', [
    '$scope', '$state', 'CnParticipantSingleton', 'CnModalRestrictFactory',
    function( $scope, $state, CnParticipantSingleton, CnModalRestrictFactory ) {
      CnBaseListCtrl.call( this, $scope, $state, CnParticipantSingleton, CnModalRestrictFactory );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ParticipantViewCtrl', [
    '$scope', '$state', '$stateParams', 'CnParticipantSingleton',
    function( $scope, $state, $stateParams, CnParticipantSingleton ) {
      CnBaseViewCtrl.call( this, $scope, $state, CnParticipantSingleton );
      $scope.local.cnView.load( $stateParams.id );
    }
  ] );

} );
