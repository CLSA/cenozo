define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnStateAdd', function () {
    return {
      templateUrl: 'app/state/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnStateView', function () {
    return {
      templateUrl: 'app/state/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
