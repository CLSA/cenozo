define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnLanguageAdd', function () {
    return {
      templateUrl: 'app/Language/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnLanguageView', function () {
    return {
      templateUrl: 'app/Language/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
