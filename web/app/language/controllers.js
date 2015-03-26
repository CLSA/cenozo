define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'LanguageAddCtrl', [
    '$scope', 'CnLanguageSingleton',
    function( $scope, CnLanguageSingleton ) {
      // use base class to create controller
      CnBaseAddCtrl.call( this, $scope, CnLanguageSingleton );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'LanguageListCtrl', [
    '$scope', '$location', 'CnLanguageSingleton', 'CnModalRestrictFactory',
    function( $scope, $location, CnLanguageSingleton, CnModalRestrictFactory ) {
      CnBaseListCtrl.call( this, $scope, $location, CnLanguageSingleton, CnModalRestrictFactory );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'LanguageViewCtrl', [
    '$scope', '$stateParams', 'CnLanguageSingleton',
    function( $scope, $stateParams, CnLanguageSingleton ) {
      CnBaseViewCtrl.call( this, $scope, CnLanguageSingleton );
      $scope.local.cnView.load( $stateParams.id );
    }
  ] );

} );
