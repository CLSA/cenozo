'use strict';

try { var system_message = angular.module( 'system_message' ); }
catch( err ) { var system_message = angular.module( 'system_message', [] ); }

/* ######################################################################################################## */
system_message.factory( 'CnSystemMessageAddFactory', [
  'CnBaseAddFactory',
  function( CnBaseAddFactory ) {
    return { instance: function( params ) { return CnBaseAddFactory.instance( params ); } };
  }
] );

/* ######################################################################################################## */
system_message.factory( 'CnSystemMessageListFactory', [
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
system_message.factory( 'CnSystemMessageViewFactory', [
  'CnBaseViewFactory',
  function( CnBaseViewFactory ) {
    return { instance: function( params ) { return CnBaseViewFactory.instance( params ); } };
  }
] );

/* ######################################################################################################## */
system_message.factory( 'CnSystemMessageSingleton', [
  'CnBaseSingletonFactory', 'CnSystemMessageListFactory', 'CnSystemMessageAddFactory', 'CnSystemMessageViewFactory', 'CnHttpFactory',
  function( CnBaseSingletonFactory, CnSystemMessageListFactory, CnSystemMessageAddFactory, CnSystemMessageViewFactory, CnHttpFactory ) {
    var object = function() {
      var base = CnBaseSingletonFactory.instance( {
        subject: 'system_message',
        name: {
          singular: 'system message',
          plural: 'system messages',
          possessive: 'system message\'s',
          pluralPossessive: 'system messages\''
        },
        cnAdd: CnSystemMessageAddFactory.instance( { subject: 'system_message' } ),
        cnList: CnSystemMessageListFactory.instance( { subject: 'system_message' } ),
        cnView: CnSystemMessageViewFactory.instance( { subject: 'system_message' } )
      } );
      for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];
    };

    object.prototype = CnBaseSingletonFactory.prototype;
    // don't return a method to create instances, create and return the singleton
    return new object();
  }
] );
