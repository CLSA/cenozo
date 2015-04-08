define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnConsentAdd', function () {
    return {
      templateUrl: 'app/consent/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnConsentView', function () {
    return {
      templateUrl: 'app/consent/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
