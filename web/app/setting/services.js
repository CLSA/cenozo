define( [], function() {

  'use strict';

  var moduleSubject = 'setting';
  var moduleNames = {
    singular: 'setting',
    plural: 'settings',
    possessive: 'setting\'s',
    pluralPossessive: 'settings\''
  };

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnSettingAddFactory', [
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
  cnCachedProviders.factory( 'CnSettingListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( params ) {
        var base = CnBaseListFactory.instance( params );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        ////////////////////////////////////
        // factory customizations start here
        this.columnList = {
          category: { title: 'Category' },
          name: { title: 'Name' },
          value: { title: 'Default' },
          description: { title: 'Description' },
        };
        this.order = { column: 'category', reverse: false };
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
  cnCachedProviders.factory( 'CnSettingViewFactory', [
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
  cnCachedProviders.factory( 'CnSettingSingleton', [
    'CnBaseSingletonFactory', 'CnSettingListFactory', 'CnSettingAddFactory', 'CnSettingViewFactory',
    function( CnBaseSingletonFactory, CnSettingListFactory, CnSettingAddFactory, CnSettingViewFactory ) {
      var object = function() {
        var base = CnBaseSingletonFactory.instance( {
          subject: moduleSubject,
          name: moduleNames,
          cnAdd: CnSettingAddFactory.instance(),
          cnList: CnSettingListFactory.instance(),
          cnView: CnSettingViewFactory.instance()
        } );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];
      };

      object.prototype = CnBaseSingletonFactory.prototype;
      // don't return a method to create instances, create and return the singleton
      return new object();
    }
  ] );

} );
