define( [], function() {

  'use strict';

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
