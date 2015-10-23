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
    inputList: {
      // TODO: fill out
    },
    columnList: {
      // TODO: fill out
    },
    defaultOrder: {
      // TODO: fill out
    }
  } );

  // load any extensions to the module
  if( module.framework ) require( [ cenozoApp.baseUrl + '/app/jurisdiction/module.extend.js' ], function() {} );

} );
