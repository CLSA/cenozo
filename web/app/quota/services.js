define( [], function() {

  'use strict';

  var moduleSubject = 'quota';
  var moduleNames = {
    singular: 'quota',
    plural: 'quotas',
    possessive: 'quota\'s',
    pluralPossessive: 'quotas\''
  };

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnQuotaAddFactory', [
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
  cnCachedProviders.factory( 'CnQuotaListFactory', [
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
          region: {
            column: 'region.name',
            title: 'Region'
          },
          gender: { title: 'Gender' },
          age_group_range: { title: 'Age Group' },
          population: { title: 'Population' }
        };
        this.order = { column: 'site', reverse: false };
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
  cnCachedProviders.factory( 'CnQuotaViewFactory', [
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
  cnCachedProviders.factory( 'CnQuotaSingleton', [
    'CnBaseSingletonFactory', 'CnQuotaListFactory', 'CnQuotaAddFactory', 'CnQuotaViewFactory',
    function( CnBaseSingletonFactory, CnQuotaListFactory, CnQuotaAddFactory, CnQuotaViewFactory ) {
      var object = function() {
        var base = CnBaseSingletonFactory.instance( {
          subject: moduleSubject,
          name: moduleNames,
          cnAdd: CnQuotaAddFactory.instance(),
          cnList: CnQuotaListFactory.instance(),
          cnView: CnQuotaViewFactory.instance()
        } );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];
      };

      object.prototype = CnBaseSingletonFactory.prototype;
      // don't return a method to create instances, create and return the singleton
      return new object();
    }
  ] );

} );
