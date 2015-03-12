'use strict';

try { var language = angular.module( 'language' ); }
catch( err ) { var language = angular.module( 'language', [] ); }

/* ######################################################################################################## */
language.controller( 'LanguageAddCtrl', [
  '$scope', 'CnLanguageSingleton',
  function( $scope, CnLanguageSingleton ) {
    // use base class to create controller
    CnBaseAddCtrl.call( this, $scope, CnLanguageSingleton );
  }
] );

/* ######################################################################################################## */
language.controller( 'LanguageListCtrl', [
  '$scope', '$location', 'CnLanguageSingleton', 'CnModalRestrictFactory',
  function( $scope, $location, CnLanguageSingleton, CnModalRestrictFactory ) {
    CnBaseListCtrl.call( this, $scope, $location, CnLanguageSingleton, CnModalRestrictFactory );
  }
] );

/* ######################################################################################################## */
language.controller( 'LanguageViewCtrl', [
  '$scope', '$routeParams', 'CnLanguageSingleton',
  function( $scope, $routeParams, CnLanguageSingleton ) {
    CnBaseViewCtrl.call( this, $scope, CnLanguageSingleton );
    $scope.local.cnView.load( $routeParams.id );
  }
] );
