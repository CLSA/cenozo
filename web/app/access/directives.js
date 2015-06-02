define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnAccessAdd', function () {
    return {
      templateUrl: 'app/access/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnAccessView', function () {
    return {
      templateUrl: 'app/access/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
