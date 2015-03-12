'use strict';

try { var activity = angular.module( 'activity' ); }
catch( err ) { var activity = angular.module( 'activity', [] ); }

/* ######################################################################################################## */
activity.directive( 'cnActivityAdd', function () {
  return {
    activityUrl: 'app/activity/add.tpl.html',
    restrict: 'E'
  };
} );

/* ######################################################################################################## */
activity.directive( 'cnActivityView', function () {
  return {
    activityUrl: 'app/activity/view.tpl.html',
    restrict: 'E'
  };
} );
