define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnSettingAdd', function () {
    return {
      templateUrl: 'app/setting/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnSettingView', function () {
    return {
      templateUrl: 'app/setting/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
