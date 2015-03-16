define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnQuotaAdd', function () {
    return {
      templateUrl: 'app/Quota/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnQuotaView', function () {
    return {
      templateUrl: 'app/Quota/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
