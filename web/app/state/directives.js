'use strict';

try { var state = angular.module( 'state' ); }
catch( err ) { var state = angular.module( 'state', [] ); }

/* ######################################################################################################## */
state.directive( 'cnStateAdd', function () {
  return {
    stateUrl: 'app/state/add.tpl.html',
    restrict: 'E'
  };
} );

/* ######################################################################################################## */
state.directive( 'cnStateView', function () {
  return {
    stateUrl: 'app/state/view.tpl.html',
    restrict: 'E'
  };
} );
