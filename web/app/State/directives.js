define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnStateAdd', function () {
    return {
      templateUrl: 'app/State/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnStateView', function () {
    return {
      templateUrl: 'app/State/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
