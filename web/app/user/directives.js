define( [], function() { 
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnUserAdd', function () {
    return {
      templateUrl: 'app/user/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnUserView', function () {
    return {
      templateUrl: 'app/user/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
