define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnSiteAdd', function () {
    return {
      templateUrl: 'app/site/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnSiteView', function () {
    return {
      templateUrl: 'app/site/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
