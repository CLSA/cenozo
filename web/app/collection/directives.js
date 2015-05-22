define( [], function() {

  'use strict';
  var cenozo = angular.module( 'cenozo' );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnCollectionAdd', function () {
    return {
      templateUrl: 'app/collection/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnCollectionView', function () {
    return {
      templateUrl: 'app/collection/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
