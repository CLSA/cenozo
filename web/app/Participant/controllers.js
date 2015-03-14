define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ParticipantAddCtrl', [
    '$scope', 'CnParticipantSingleton',
    function( $scope, CnParticipantSingleton ) {
      // use base class to create controller
      CnBaseAddCtrl.call( this, $scope, CnParticipantSingleton );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ParticipantListCtrl', [
    '$scope', '$location', 'CnParticipantSingleton', 'CnModalRestrictFactory',
    function( $scope, $location, CnParticipantSingleton, CnModalRestrictFactory ) {
      CnBaseListCtrl.call( this, $scope, $location, CnParticipantSingleton, CnModalRestrictFactory );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ParticipantViewCtrl', [
    '$scope', '$stateParams', 'CnParticipantSingleton',
    function( $scope, $stateParams, CnParticipantSingleton ) {
      CnBaseViewCtrl.call( this, $scope, CnParticipantSingleton );
      $scope.local.cnView.load( $stateParams.id );
    }
  ] );

} );
