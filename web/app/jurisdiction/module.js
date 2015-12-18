define( function() {
  'use strict';

  try { var url = cenozoApp.module( 'jurisdiction', true ).url; } catch( err ) { console.warn( err ); return; }
  angular.extend( cenozoApp.module( 'jurisdiction' ), {
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
