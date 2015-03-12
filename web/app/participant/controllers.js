'use strict';

try { var participant = angular.module( 'participant' ); }
catch( err ) { var participant = angular.module( 'participant', [] ); }

/* ######################################################################################################## */
participant.controller( 'ParticipantAddCtrl', [
  '$scope', 'CnParticipantSingleton',
  function( $scope, CnParticipantSingleton ) {
    // use base class to create controller
    CnBaseAddCtrl.call( this, $scope, CnParticipantSingleton );
  }
] );

/* ######################################################################################################## */
participant.controller( 'ParticipantListCtrl', [
  '$scope', '$location', 'CnParticipantSingleton', 'CnModalRestrictFactory',
  function( $scope, $location, CnParticipantSingleton, CnModalRestrictFactory ) {
    CnBaseListCtrl.call( this, $scope, $location, CnParticipantSingleton, CnModalRestrictFactory );
  }
] );

/* ######################################################################################################## */
participant.controller( 'ParticipantViewCtrl', [
  '$scope', '$routeParams', 'CnParticipantSingleton',
  function( $scope, $routeParams, CnParticipantSingleton ) {
    CnBaseViewCtrl.call( this, $scope, CnParticipantSingleton );
    $scope.local.cnView.load( $routeParams.id );
  }
] );
