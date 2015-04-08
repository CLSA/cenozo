define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnAddressAdd', function () {
    return {
      templateUrl: 'app/address/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnAddressView', function () {
    return {
      templateUrl: 'app/address/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
