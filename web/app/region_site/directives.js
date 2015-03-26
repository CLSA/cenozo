define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnRegionSiteAdd', function () {
    return {
      templateUrl: 'app/RegionSite/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnRegionSiteView', function () {
    return {
      templateUrl: 'app/RegionSite/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
