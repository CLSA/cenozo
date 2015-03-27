define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnUserAdd', function () {
    return {
      templateUrl: 'app/user/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnUserView', function () {
    return {
      templateUrl: 'app/user/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
