define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnScriptAdd', function () {
    return {
      templateUrl: 'app/script/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnScriptView', function () {
    return {
      templateUrl: 'app/script/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
