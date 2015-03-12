'use strict';

try { var collection = angular.module( 'collection' ); }
catch( err ) { var collection = angular.module( 'collection', [] ); }

/* ######################################################################################################## */
collection.directive( 'cnCollectionAdd', function () {
  return {
    collectionUrl: 'app/collection/add.tpl.html',
    restrict: 'E'
  };
} );

/* ######################################################################################################## */
collection.directive( 'cnCollectionView', function () {
  return {
    collectionUrl: 'app/collection/view.tpl.html',
    restrict: 'E'
  };
} );
