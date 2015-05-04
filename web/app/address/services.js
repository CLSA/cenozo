define( [
  cnCenozoUrl + '/app/address/module.js'
], function( module ) {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnAddressAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) {
        CnBaseAddFactory.construct( this, parentModel, module );
        this.validate();
      };

      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnAddressListFactory', [
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
  cnCachedProviders.factory( 'CnAddressViewFactory', [
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
  cnCachedProviders.factory( 'CnAddressModelFactory', [
    'CnBaseModelFactory', 'CnAddressListFactory', 'CnAddressAddFactory', 'CnAddressViewFactory',
    'CnHttpFactory', 'CnAppSingleton',
    function( CnBaseModelFactory, CnAddressListFactory, CnAddressAddFactory, CnAddressViewFactory,
              CnHttpFactory, CnAppSingleton ) {
      var object = function() {
        this.subject = module.subject;
        CnBaseModelFactory.apply( this );
        this.name = module.name;
        this.cnAdd = CnAddressAddFactory.instance( this );
        this.cnList = CnAddressListFactory.instance( { parentModel: this } );
        this.cnView = CnAddressViewFactory.instance( { parentModel: this } );

        this.cnList.enableAdd( true );
        this.cnList.enableDelete( true );
        this.cnList.enableView( true );

        // process metadata
        var thisRef = this;
        this.promise.then( function() {
          CnHttpFactory.instance( {
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
            thisRef.metadata.columnList.region_id.enumList = [];
            for( var i = 0; i < response.data.length; i++ ) {
              thisRef.metadata.columnList.region_id.enumList.push( {
                value: response.data[i].id,
                name: response.data[i].name
              } );
            }
          } ).finally( function() {
            // signal that the metadata is finished loading
            thisRef.metadata.isLoading = false;
          } ).catch( function exception() { cnFatalError(); } );
        } );
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
