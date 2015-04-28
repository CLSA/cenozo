define( [
  cnCenozoUrl + '/app/system_message/module.js'
], function( module ) {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnSystemMessageAddFactory', [
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
  cnCachedProviders.factory( 'CnSystemMessageListFactory', [
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
  cnCachedProviders.factory( 'CnSystemMessageViewFactory', [
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
  cnCachedProviders.factory( 'CnSystemMessageSingleton', [
    'CnBaseSingletonFactory',
    'CnSystemMessageListFactory', 'CnSystemMessageAddFactory', 'CnSystemMessageViewFactory',
    function( CnBaseSingletonFactory,
              CnSystemMessageListFactory, CnSystemMessageAddFactory, CnSystemMessageViewFactory ) {
      return new ( function() {
        this.subject = module.subject;
        CnBaseSingletonFactory.apply( this );
        this.name = module.name;
        this.cnAdd = CnSystemMessageAddFactory.instance( { parentModel: this } );
        this.cnList = CnSystemMessageListFactory.instance( { parentModel: this } );
        this.cnView = CnSystemMessageViewFactory.instance( { parentModel: this } );

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
