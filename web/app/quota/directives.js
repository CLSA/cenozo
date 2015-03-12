'use strict';

try { var quota = angular.module( 'quota' ); }
catch( err ) { var quota = angular.module( 'quota', [] ); }

/* ######################################################################################################## */
quota.directive( 'cnQuotaAdd', function () {
  return {
    quotaUrl: 'app/quota/add.tpl.html',
    restrict: 'E'
  };
} );

/* ######################################################################################################## */
quota.directive( 'cnQuotaView', function () {
  return {
    quotaUrl: 'app/quota/view.tpl.html',
    restrict: 'E'
  };
} );
