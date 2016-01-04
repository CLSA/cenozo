define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'jurisdiction', true ); } catch( err ) { console.warn( err ); return; }
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
