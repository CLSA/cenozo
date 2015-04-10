define( [
  cnCenozoUrl + '/app/participant/module.js'
], function( module ) {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnParticipantListFactory', [
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
  cnCachedProviders.factory( 'CnParticipantViewFactory', [
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
  cnCachedProviders.factory( 'CnParticipantSingleton', [
    'CnBaseSingletonFactory', 'CnParticipantListFactory', 'CnParticipantViewFactory',
    function( CnBaseSingletonFactory, CnParticipantListFactory, CnParticipantViewFactory ) {
      return new ( function() {
        this.subject = module.subject;
        CnBaseSingletonFactory.apply( this );
        this.name = module.name;
        this.cnList = CnParticipantListFactory.instance( { parentModel: this } );
        this.cnView = CnParticipantViewFactory.instance( { parentModel: this } );

        this.cnList.enableDelete( true );
        this.cnList.enableView( true );
      } );
    }
  ] );

} );
