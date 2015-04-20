define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnApplicationAdd', function () {
    return {
      templateUrl: 'app/application/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnApplicationView', function () {
    return {
      templateUrl: 'app/application/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
