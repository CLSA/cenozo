define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnCollectionAdd', function () {
    return {
      templateUrl: 'app/collection/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnCollectionView', function () {
    return {
      templateUrl: 'app/collection/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
