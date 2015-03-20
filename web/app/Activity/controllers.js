define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ActivityListCtrl', [
    '$scope', '$location', 'CnActivitySingleton', 'CnModalRestrictFactory',
    function( $scope, $location, CnActivitySingleton, CnModalRestrictFactory ) {
      CnBaseListCtrl.call( this, $scope, $location, CnActivitySingleton, CnModalRestrictFactory );
    }
  ] );

} );
