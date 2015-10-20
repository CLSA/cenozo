define( [], function() { 
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnStateAdd', function () {
    return {
      templateUrl: 'app/state/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnStateView', function () {
    return {
      templateUrl: 'app/state/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
