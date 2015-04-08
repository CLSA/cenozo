define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnEventAdd', function () {
    return {
      templateUrl: 'app/event/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnEventView', function () {
    return {
      templateUrl: 'app/event/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
