define( [], function() {

  'use strict';

  var moduleSubject = 'phone';
  var moduleNames = {
    // TODO: fill out
  };
  var inputList = {
    // TODO: fill out
  };

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnPhoneAddFactory', [
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
  cnCachedProviders.factory( 'CnPhoneListFactory', [
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
  cnCachedProviders.factory( 'CnPhoneViewFactory', [
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
  cnCachedProviders.factory( 'CnPhoneSingleton', [
    'CnBaseSingletonFactory', 'CnPhoneListFactory', 'CnPhoneAddFactory', 'CnPhoneViewFactory',
    function( CnBaseSingletonFactory, CnPhoneListFactory, CnPhoneAddFactory, CnPhoneViewFactory ) {
      return new ( function() {
        this.subject = moduleSubject;
        CnBaseSingletonFactory.apply( this );
        this.name = moduleNames;
        this.cnAdd = CnPhoneAddFactory.instance( { parentModel: this } );
        this.cnList = CnPhoneListFactory.instance( { parentModel: this } );
        this.cnView = CnPhoneViewFactory.instance( { parentModel: this } );

        this.cnList.enableAdd( true );
        this.cnList.enableDelete( true );
        this.cnList.enableView( true );
      } );
    }
  ] );

} );
