define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnSystemMessageAdd', function () {
    return {
      templateUrl: 'app/system_message/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnSystemMessageView', function () {
    return {
      templateUrl: 'app/system_message/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
