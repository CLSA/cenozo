'use strict';

try { var region_site = angular.module( 'region_site' ); }
catch( err ) { var region_site = angular.module( 'region_site', [] ); }

/* ######################################################################################################## */
region_site.directive( 'cnRegionSiteAdd', function () {
  return {
    templateUrl: 'app/region_site/add.tpl.html',
    restrict: 'E'
  };
} );

/* ######################################################################################################## */
region_site.directive( 'cnRegionSiteView', function () {
  return {
    templateUrl: 'app/region_site/view.tpl.html',
    restrict: 'E'
  };
} );
