define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnAddressAdd', function () {
    return {
      templateUrl: 'app/address/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnAddressView', function () {
    return {
      templateUrl: 'app/address/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
