define( [], function() {

  'use strict';

  var moduleSubject = 'language';
  var moduleNames = {
    singular: 'language',
    plural: 'languages',
    possessive: 'language\'s',
    pluralPossessive: 'languages\''
  };

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnLanguageAddFactory', [
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
  cnCachedProviders.factory( 'CnLanguageListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( params ) {
        var base = CnBaseListFactory.instance( params );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        ////////////////////////////////////
        // factory customizations start here
        this.columnList = {
          name: { title: 'Name' },
          code: { title: 'Code' },
          active: {
            column: 'language.active',
            title: 'Active',
            filter: 'cnYesNo'
          },
          participant_count: { title: 'Participants' }
        };
        this.order = { column: 'name', reverse: false };
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
  cnCachedProviders.factory( 'CnLanguageViewFactory', [
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
  cnCachedProviders.factory( 'CnLanguageSingleton', [
    'CnBaseSingletonFactory', 'CnLanguageListFactory', 'CnLanguageAddFactory', 'CnLanguageViewFactory',
    function( CnBaseSingletonFactory, CnLanguageListFactory, CnLanguageAddFactory, CnLanguageViewFactory ) {
      var object = function() {
        var base = CnBaseSingletonFactory.instance( {
          subject: moduleSubject,
          name: moduleNames,
          cnAdd: CnLanguageAddFactory.instance(),
          cnList: CnLanguageListFactory.instance(),
          cnView: CnLanguageViewFactory.instance()
        } );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];
      };

      object.prototype = CnBaseSingletonFactory.prototype;
      // don't return a method to create instances, create and return the singleton
      return new object();
    }
  ] );

} );
