define( [], function() {

  'use strict';

  var moduleSubject = 'region_site';
  var moduleNames = {
    singular: 'region site',
    plural: 'region sites',
    possessive: 'region site\'s',
    pluralPossessive: 'region sites\''
  };

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnRegionSiteAddFactory', [
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
  cnCachedProviders.factory( 'CnRegionSiteListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( params ) {
        var base = CnBaseListFactory.instance( params );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        ////////////////////////////////////
        // factory customizations start here
        this.columnList = {
          region: {
            column: 'region.name',
            title: 'Region'
          },
          language: {
            column: 'language.name',
            title: 'Language'
          },
          site: {
            column: 'site.name',
            title: 'Site'
          }
        };
        this.order = { column: 'region', reverse: false };
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
  cnCachedProviders.factory( 'CnRegionSiteViewFactory', [
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
  cnCachedProviders.factory( 'CnRegionSiteSingleton', [
    'CnBaseSingletonFactory', 'CnRegionSiteListFactory', 'CnRegionSiteAddFactory', 'CnRegionSiteViewFactory',
    function( CnBaseSingletonFactory, CnRegionSiteListFactory, CnRegionSiteAddFactory, CnRegionSiteViewFactory ) {
      var object = function() {
        var base = CnBaseSingletonFactory.instance( {
          subject: moduleSubject,
          name: moduleNames,
          cnAdd: CnRegionSiteAddFactory.instance(),
          cnList: CnRegionSiteListFactory.instance(),
          cnView: CnRegionSiteViewFactory.instance()
        } );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];
      };

      object.prototype = CnBaseSingletonFactory.prototype;
      // don't return a method to create instances, create and return the singleton
      return new object();
    }
  ] );

} );
