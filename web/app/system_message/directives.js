define( [], function() { 
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnSystemMessageAdd', function () {
    return {
      templateUrl: 'app/system_message/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnSystemMessageView', function () {
    return {
      templateUrl: 'app/system_message/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
