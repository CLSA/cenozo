define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnActivityAdd', function () {
    return {
      templateUrl: 'app/activity/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnActivityView', function () {
    return {
      templateUrl: 'app/activity/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
