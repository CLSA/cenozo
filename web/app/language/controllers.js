define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'LanguageAddCtrl', [
    '$scope', '$state', 'CnLanguageSingleton',
    function( $scope, $state, CnLanguageSingleton ) {
      CnBaseAddCtrl.call( this, $scope, CnLanguageSingleton );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'LanguageListCtrl', [
    '$scope', '$state', 'CnLanguageSingleton', 'CnModalRestrictFactory',
    function( $scope, $state, CnLanguageSingleton, CnModalRestrictFactory ) {
      CnBaseListCtrl.call( this, $scope, $state, CnLanguageSingleton, CnModalRestrictFactory );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'LanguageViewCtrl', [
    '$scope', '$state', '$stateParams', 'CnLanguageSingleton',
    function( $scope, $state, $stateParams, CnLanguageSingleton ) {
      CnBaseViewCtrl.call( this, $scope, $state, CnLanguageSingleton );
      $scope.local.cnView.load( $stateParams.id );
    }
  ] );

} );
