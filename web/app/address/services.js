define( [
  cnCenozoUrl + '/app/address/module.js'
], function( module ) {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnAddressAddFactory', [
    'CnBaseAddFactory', 'CnHttpFactory',
    function( CnBaseAddFactory, CnHttpFactory ) {
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
    'CnBaseViewFactory', 'CnParticipantListFactory', 'CnUserListFactory',
    function( CnBaseViewFactory, CnParticipantListFactory, CnUserListFactory ) {
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
  cnCachedProviders.factory( 'CnAddressSingleton', [
    'CnBaseSingletonFactory', 'CnAddressListFactory', 'CnAddressAddFactory', 'CnAddressViewFactory',
    function( CnBaseSingletonFactory, CnAddressListFactory, CnAddressAddFactory, CnAddressViewFactory ) {
      return new ( function() {
        this.subject = module.subject;
        CnBaseSingletonFactory.apply( this );
        this.name = module.name;
        this.cnAdd = CnAddressAddFactory.instance( { parentModel: this } );
        this.cnList = CnAddressListFactory.instance( { parentModel: this } );
        this.cnView = CnAddressViewFactory.instance( { parentModel: this } );

        this.cnList.enableAdd( true );
        this.cnList.enableDelete( true );
        this.cnList.enableView( true );

        // process metadata
        var thisRef = this;
        this.promise.then( function() { thisRef.metadata.isLoading = false; } );
      } );
    }
  ] );

} );
