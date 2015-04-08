define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnAlternateAdd', function () {
    return {
      templateUrl: 'app/alternate/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnAlternateView', function () {
    return {
      templateUrl: 'app/alternate/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
