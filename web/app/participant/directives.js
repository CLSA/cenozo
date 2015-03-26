define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnParticipantAdd', function () {
    return {
      templateUrl: 'app/Participant/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnParticipantView', function () {
    return {
      templateUrl: 'app/Participant/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
