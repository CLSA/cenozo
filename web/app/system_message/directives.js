define( [], function() {

  'use strict';
  var cenozo = angular.module( 'cenozo' );

  /* ######################################################################################################## */
  cenozo.providersdirective( 'cnSystemMessageAdd', function () {
    return {
      templateUrl: 'app/system_message/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providersdirective( 'cnSystemMessageView', function () {
    return {
      templateUrl: 'app/system_message/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
