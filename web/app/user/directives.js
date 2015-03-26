define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnUserAdd', function () {
    return {
      templateUrl: 'app/User/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnUserView', function () {
    return {
      templateUrl: 'app/User/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
