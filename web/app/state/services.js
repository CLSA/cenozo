'use strict';

try { var state = angular.module( 'state' ); }
catch( err ) { var state = angular.module( 'state', [] ); }

/* ######################################################################################################## */
state.factory( 'CnStateAddFactory', [
  'CnBaseAddFactory',
  function( CnBaseAddFactory ) {
    return { instance: function( params ) { return CnBaseAddFactory.instance( params ); } };
  }
] );

/* ######################################################################################################## */
state.factory( 'CnStateListFactory', [
  'CnBaseListFactory',
  function( CnBaseListFactory ) {
    var object = function( params ) {
      var base = CnBaseListFactory.instance( params );
      for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

      ////////////////////////////////////
      // factory customizations start here
      this.columnList = {
        id: { title: 'ID' }
      };
      this.order = { column: 'id', reverse: false };
      // factory customizations end here
      //////////////////////////////////

      cnCopyParams( this, params );
    };

    object.prototype = CnBaseListFactory.prototype;
    return { instance: function( params ) { return new object( undefined === params ? {} : params ); } };
  }
] );

/* ######################################################################################################## */
state.factory( 'CnStateViewFactory', [
  'CnBaseViewFactory',
  function( CnBaseViewFactory ) {
    return { instance: function( params ) { return CnBaseViewFactory.instance( params ); } };
  }
] );

/* ######################################################################################################## */
state.factory( 'CnStateSingleton', [
  'CnBaseSingletonFactory', 'CnStateListFactory', 'CnStateAddFactory', 'CnStateViewFactory', 'CnHttpFactory',
  function( CnBaseSingletonFactory, CnStateListFactory, CnStateAddFactory, CnStateViewFactory, CnHttpFactory ) {
    var object = function() {
      var base = CnBaseSingletonFactory.instance( {
        subject: 'state',
        name: {
          singular: 'state',
          plural: 'states',
          possessive: 'state\'s',
          pluralPossessive: 'states\''
        },
        cnAdd: CnStateAddFactory.instance( { subject: 'state' } ),
        cnList: CnStateListFactory.instance( { subject: 'state' } ),
        cnView: CnStateViewFactory.instance( { subject: 'state' } )
      } );
      for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];
    };

    object.prototype = CnBaseSingletonFactory.prototype;
    // don't return a method to create instances, create and return the singleton
    return new object();
  }
] );
