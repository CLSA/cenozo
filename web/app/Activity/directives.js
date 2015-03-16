define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnActivityAdd', function () {
    return {
      templateUrl: 'app/Activity/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnActivityView', function () {
    return {
      templateUrl: 'app/Activity/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
