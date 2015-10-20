define( [], function() { 
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnRegionSiteAdd', function () {
    return {
      templateUrl: 'app/region_site/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnRegionSiteView', function () {
    return {
      templateUrl: 'app/region_site/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
