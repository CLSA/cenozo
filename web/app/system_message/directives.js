define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnSystemMessageAdd', function () {
    return {
      templateUrl: 'app/SystemMessage/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnSystemMessageView', function () {
    return {
      templateUrl: 'app/SystemMessage/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
