define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnCollectionAdd', function () {
    return {
      templateUrl: 'app/Collection/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cnCachedProviders.directive( 'cnCollectionView', function () {
    return {
      templateUrl: 'app/Collection/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
