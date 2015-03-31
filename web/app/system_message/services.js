define( [], function() {

  'use strict';

  var moduleSubject = 'system_message';
  var moduleNames = {
    singular: 'system message',
    plural: 'system messages',
    possessive: 'system message\'s',
    pluralPossessive: 'system messages\''
  };

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnSystemMessageAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      return { instance: function( params ) {
        if( undefined === params ) params = {};
        params.subject = moduleSubject;
        params.name = moduleNames;
        return CnBaseAddFactory.instance( params );
      } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnSystemMessageListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( params ) {
        var base = CnBaseListFactory.instance( params );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        ////////////////////////////////////
        // factory customizations start here
        this.columnList = {
          site: {
            column: 'site.name',
            title: 'Site'
          },
          role: {
            column: 'role.name',
            title: 'Role'
          },
          title: {
            column: 'system_message.title',
            title: 'Title'
          }
        };
        this.order = { column: 'title', reverse: false };
        // factory customizations end here
        //////////////////////////////////

        cnCopyParams( this, params );
      };

      object.prototype = CnBaseListFactory.prototype;
      return { instance: function( params ) {
        if( undefined === params ) params = {};
        params.subject = moduleSubject;
        params.name = moduleNames;
        return new object( params );
      } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnSystemMessageViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      return { instance: function( params ) {
        if( undefined === params ) params = {};
        params.subject = moduleSubject;
        params.name = moduleNames;
        return CnBaseViewFactory.instance( params );
      } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnSystemMessageSingleton', [
    'CnBaseSingletonFactory', 'CnSystemMessageListFactory', 'CnSystemMessageAddFactory', 'CnSystemMessageViewFactory',
    function( CnBaseSingletonFactory, CnSystemMessageListFactory, CnSystemMessageAddFactory, CnSystemMessageViewFactory ) {
      var object = function() {
        var base = CnBaseSingletonFactory.instance( {
          subject: moduleSubject,
          name: moduleNames,
          cnAdd: CnSystemMessageAddFactory.instance(),
          cnList: CnSystemMessageListFactory.instance(),
          cnView: CnSystemMessageViewFactory.instance()
        } );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];
      };

      object.prototype = CnBaseSingletonFactory.prototype;
      // don't return a method to create instances, create and return the singleton
      return new object();
    }
  ] );

} );
