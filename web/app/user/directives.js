'use strict';

try { var user = angular.module( 'user' ); }
catch( err ) { var user = angular.module( 'user', [] ); }

/* ######################################################################################################## */
user.directive( 'cnUserAdd', function () {
  return {
    userUrl: 'app/user/add.tpl.html',
    restrict: 'E'
  };
} );

/* ######################################################################################################## */
user.directive( 'cnUserView', function () {
  return {
    userUrl: 'app/user/view.tpl.html',
    restrict: 'E'
  };
} );
