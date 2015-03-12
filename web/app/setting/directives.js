'use strict';

try { var setting = angular.module( 'setting' ); }
catch( err ) { var setting = angular.module( 'setting', [] ); }

/* ######################################################################################################## */
setting.directive( 'cnSettingAdd', function () {
  return {
    settingUrl: 'app/setting/add.tpl.html',
    restrict: 'E'
  };
} );

/* ######################################################################################################## */
setting.directive( 'cnSettingView', function () {
  return {
    settingUrl: 'app/setting/view.tpl.html',
    restrict: 'E'
  };
} );
