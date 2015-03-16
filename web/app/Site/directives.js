define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnSiteAdd', function () {
    return {
      templateUrl: 'app/Site/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnSiteView', function () {
    return {
      templateUrl: 'app/Site/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
