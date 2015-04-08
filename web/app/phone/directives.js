define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnPhoneAdd', function () {
    return {
      templateUrl: 'app/phone/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnPhoneView', function () {
    return {
      templateUrl: 'app/phone/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
