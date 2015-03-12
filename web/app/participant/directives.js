'use strict';

try { var participant = angular.module( 'participant' ); }
catch( err ) { var participant = angular.module( 'participant', [] ); }

/* ######################################################################################################## */
participant.directive( 'cnParticipantAdd', function () {
  return {
    participantUrl: 'app/participant/add.tpl.html',
    restrict: 'E'
  };
} );

/* ######################################################################################################## */
participant.directive( 'cnParticipantView', function () {
  return {
    participantUrl: 'app/participant/view.tpl.html',
    restrict: 'E'
  };
} );
