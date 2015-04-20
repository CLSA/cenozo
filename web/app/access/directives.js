define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnAccessAdd', function () {
    return {
      templateUrl: 'app/access/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnAccessView', function () {
    return {
      templateUrl: 'app/access/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
