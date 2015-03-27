define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'ActivityListCtrl', [
    '$scope', '$state', 'CnActivitySingleton', 'CnModalRestrictFactory',
    function( $scope, $state, CnActivitySingleton, CnModalRestrictFactory ) {
      CnBaseListCtrl.call( this, $scope, $state, CnActivitySingleton, CnModalRestrictFactory );
    }
  ] );

} );
