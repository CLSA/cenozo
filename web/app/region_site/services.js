define( [
  cnCenozoUrl + '/app/region_site/module.js'
], function( module ) {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnRegionSiteAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      return { instance: function( params ) {
        if( undefined === params ) params = {};
        params.subject = module.subject;
        params.name = module.name;
        params.inputList = module.inputList;
        return CnBaseAddFactory.instance( params );
      } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnRegionSiteListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      return { instance: function( params ) {
        if( undefined === params ) params = {};
        params.subject = module.subject;
        params.name = module.name;
        params.columnList = module.columnList;
        params.order = module.defaultOrder;
        return CnBaseListFactory.instance( params );
      } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnRegionSiteViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      return { instance: function( params ) {
        if( undefined === params ) params = {};
        params.subject = module.subject;
        params.name = module.name;
        params.inputList = module.inputList;
        return CnBaseViewFactory.instance( params );
      } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnRegionSiteSingleton', [
    'CnBaseSingletonFactory',
    'CnRegionSiteListFactory', 'CnRegionSiteAddFactory', 'CnRegionSiteViewFactory',
    'CnHttpFactory', 'CnAppSingleton',
    function( CnBaseSingletonFactory,
              CnRegionSiteListFactory, CnRegionSiteAddFactory, CnRegionSiteViewFactory,
              CnHttpFactory, CnAppSingleton ) {
      return new ( function() {
        this.subject = module.subject;
        CnBaseSingletonFactory.apply( this );
        this.name = module.name;
        this.cnAdd = CnRegionSiteAddFactory.instance( { parentModel: this } );
        this.cnList = CnRegionSiteListFactory.instance( { parentModel: this } );
        this.cnView = CnRegionSiteViewFactory.instance( { parentModel: this } );

        this.cnList.enableAdd( true );
        this.cnList.enableDelete( true );
        this.cnList.enableView( true );

        // populate the foreign key enumerations
        var thisRef = this;
        this.promise.then( function() {
          CnHttpFactory.instance( {
            path: 'language',
            data: {
              select: { column: [ 'id', 'name' ] },
              modifier: {
                where: {
                  column: 'active',
                  operator: '=',
                  value: true
                },
                order: 'name'
              }
            }
          } ).query().then( function success( response ) {
            thisRef.metadata.language_id.enumList = [];
            for( var i = 0; i < response.data.length; i++ ) {
              thisRef.metadata.language_id.enumList.push( {
                value: response.data[i].id,
                name: response.data[i].name
              } );
            }
          } ).then( function() {
            return CnHttpFactory.instance( {
              path: 'region',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: {
                  where: {
                    column: 'country',
                    operator: '=',
                    value: CnAppSingleton.application.country
                  },
                  order: 'name'
                }
              }
            } ).query().then( function success( response ) {
              thisRef.metadata.region_id.enumList = [];
              for( var i = 0; i < response.data.length; i++ ) {
                thisRef.metadata.region_id.enumList.push( {
                  value: response.data[i].id,
                  name: response.data[i].name
                } );
              }
            } );
          } ).then( function() {
            return CnHttpFactory.instance( {
              path: 'application/' + CnAppSingleton.application.id + '/site',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: { order: 'name' }
              }
            } ).query().then( function success( response ) {
              thisRef.metadata.site_id.enumList = [];
              for( var i = 0; i < response.data.length; i++ ) {
                thisRef.metadata.site_id.enumList.push( {
                  value: response.data[i].id,
                  name: response.data[i].name
                } );
              }
            } );
          } ).catch( function exception() { cnFatalError(); } );
        } );
      } );
    }
  ] );

} );
