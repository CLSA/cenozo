define( [], function() {

  'use strict';
  var cenozo = angular.module( 'cenozo' );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnParticipantAdd', function () {
    return {
      templateUrl: 'app/participant/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnParticipantView', function () {
    return {
      templateUrl: 'app/participant/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
