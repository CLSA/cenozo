define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnRegionSiteAdd', function () {
    return {
      templateUrl: 'app/region_site/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnRegionSiteView', function () {
    return {
      templateUrl: 'app/region_site/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
