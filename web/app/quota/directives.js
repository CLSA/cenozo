define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnQuotaAdd', function () {
    return {
      templateUrl: 'app/quota/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnQuotaView', function () {
    return {
      templateUrl: 'app/quota/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
