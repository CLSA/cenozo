'use strict';

try { var system_message = angular.module( 'system_message' ); }
catch( err ) { var system_message = angular.module( 'system_message', [] ); }

/* ######################################################################################################## */
system_message.directive( 'cnSystemMessageAdd', function () {
  return {
    system_messageUrl: 'app/system_message/add.tpl.html',
    restrict: 'E'
  };
} );

/* ######################################################################################################## */
system_message.directive( 'cnSystemMessageView', function () {
  return {
    system_messageUrl: 'app/system_message/view.tpl.html',
    restrict: 'E'
  };
} );
