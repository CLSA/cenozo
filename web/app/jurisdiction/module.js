define( cenozo.getDependencyList( 'jurisdiction' ), function() {
  'use strict';

  var module = cenozoApp.module( 'jurisdiction' );
  angular.extend( module, {
    identifier: {}, // standard
    name: {
      singular: 'jurisdiction',
      plural: 'jurisdictions',
      possessive: 'jurisdiction\'s',
      pluralPossessive: 'jurisdictions\''
    },
    columnList: {
      // TODO: fill out
    },
    defaultOrder: {
      // TODO: fill out
    }
  } );

} );
