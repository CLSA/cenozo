define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnEventAdd', function () {
    return {
      templateUrl: 'app/event/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnEventView', function () {
    return {
      templateUrl: 'app/event/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
