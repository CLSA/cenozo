define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnSettingAdd', function () {
    return {
      templateUrl: 'app/Setting/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnSettingView', function () {
    return {
      templateUrl: 'app/Setting/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
