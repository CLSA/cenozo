define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnQuotaAdd', function () {
    return {
      templateUrl: 'app/quota/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnQuotaView', function () {
    return {
      templateUrl: 'app/quota/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
