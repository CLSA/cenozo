define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnParticipantAdd', function () {
    return {
      templateUrl: 'app/participant/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnParticipantView', function () {
    return {
      templateUrl: 'app/participant/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
