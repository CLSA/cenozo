define( [], function() {

  'use strict';

  var moduleSubject = 'address';
  var moduleNames = {
    // TODO: fill out
  };
  var inputList = {
    // TODO: fill out
  };

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnAddressAddFactory', [
    'CnBaseAddFactory', 'CnHttpFactory',
    function( CnBaseAddFactory, CnHttpFactory ) {
      return { instance: function( params ) {
        if( undefined === params ) params = {};
        params.subject = moduleSubject;
        params.name = moduleNames;
        params.inputList = inputList;
        return CnBaseAddFactory.instance( params );
      } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnAddressListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( params ) {
        var base = CnBaseListFactory.instance( params );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        ////////////////////////////////////
        // factory customizations start here
        this.columnList = {
          // TODO: fill out
        }
        this.order = { /* TODO: fill out */ }; 
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
  cnCachedProviders.factory( 'CnAddressViewFactory', [
    'CnBaseViewFactory', 'CnParticipantListFactory', 'CnUserListFactory',
    function( CnBaseViewFactory, CnParticipantListFactory, CnUserListFactory ) {
      var object = function( params ) {
        var base = CnBaseViewFactory.instance( params );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        ////////////////////////////////////
        // factory customizations start here
        // factory customizations end here
        //////////////////////////////////

        cnCopyParams( this, params );
      }

      object.prototype = CnBaseViewFactory.prototype;
      return { instance: function( params ) {
        if( undefined === params ) params = {};
        params.subject = moduleSubject;
        params.name = moduleNames;
        params.inputList = inputList;
        return new object( params );
      } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnAddressSingleton', [
    'CnBaseSingletonFactory', 'CnAddressListFactory', 'CnAddressAddFactory', 'CnAddressViewFactory',
    function( CnBaseSingletonFactory, CnAddressListFactory, CnAddressAddFactory, CnAddressViewFactory ) {
      return new ( function() {
        this.subject = moduleSubject;
        CnBaseSingletonFactory.apply( this );
        this.name = moduleNames;
        this.cnAdd = CnAddressAddFactory.instance( { parentModel: this } );
        this.cnList = CnAddressListFactory.instance( { parentModel: this } );
        this.cnView = CnAddressViewFactory.instance( { parentModel: this } );

        this.cnList.enableAdd( true );
        this.cnList.enableDelete( true );
        this.cnList.enableView( true );
      } );
    }
  ] );

} );
