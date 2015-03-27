define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnRegionSiteAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      return { instance: function( params ) { return CnBaseAddFactory.instance( params ); } };
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
      return { instance: function( params ) { return new object( undefined === params ? {} : params ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnRegionSiteViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      return { instance: function( params ) { return CnBaseViewFactory.instance( params ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnRegionSiteSingleton', [
    'CnBaseSingletonFactory', 'CnRegionSiteListFactory', 'CnRegionSiteAddFactory', 'CnRegionSiteViewFactory',
    function( CnBaseSingletonFactory, CnRegionSiteListFactory, CnRegionSiteAddFactory, CnRegionSiteViewFactory ) {
      var object = function() {
        var base = CnBaseSingletonFactory.instance( {
          subject: 'region_site',
          name: {
            singular: 'region site',
            plural: 'region sites',
            possessive: 'region site\'s',
            pluralPossessive: 'region sites\''
          },
          cnAdd: CnRegionSiteAddFactory.instance( { subject: 'region_site' } ),
          cnList: CnRegionSiteListFactory.instance( { subject: 'region_site' } ),
          cnView: CnRegionSiteViewFactory.instance( { subject: 'region_site' } )
        } );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];
      };

      object.prototype = CnBaseSingletonFactory.prototype;
      // don't return a method to create instances, create and return the singleton
      return new object();
    }
  ] );

} );
