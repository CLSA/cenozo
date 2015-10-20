define( [], function() { 
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnSourceAdd', function () {
    return {
      templateUrl: 'app/source/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnSourceView', function () {
    return {
      templateUrl: 'app/source/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
