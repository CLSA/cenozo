define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnLanguageAdd', function () {
    return {
      templateUrl: 'app/language/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnLanguageView', function () {
    return {
      templateUrl: 'app/language/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
