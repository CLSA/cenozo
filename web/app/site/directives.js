define( [], function() { 
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnSiteAdd', function () {
    return {
      templateUrl: 'app/site/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnSiteView', function () {
    return {
      templateUrl: 'app/site/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
