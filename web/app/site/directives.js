'use strict';

try { var site = angular.module( 'site' ); }
catch( err ) { var site = angular.module( 'site', [] ); }

/* ######################################################################################################## */
site.directive( 'cnSiteAdd', function () {
  return {
    siteUrl: 'app/site/add.tpl.html',
    restrict: 'E'
  };
} );

/* ######################################################################################################## */
site.directive( 'cnSiteView', function () {
  return {
    siteUrl: 'app/site/view.tpl.html',
    restrict: 'E'
  };
} );
