define( [
  cnCenozoUrl + '/app/setting/module.js'
], function( module ) {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnSettingListFactory', [
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
  cnCachedProviders.factory( 'CnSettingViewFactory', [
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
  cnCachedProviders.factory( 'CnSettingSingleton', [
    'CnBaseSingletonFactory', 'CnSettingListFactory', 'CnSettingViewFactory',
    function( CnBaseSingletonFactory, CnSettingListFactory, CnSettingViewFactory ) {
      return new ( function() {
        this.subject = module.subject;
        CnBaseSingletonFactory.apply( this );
        this.name = module.name;
        this.cnList = CnSettingListFactory.instance( { parentModel: this } );
        this.cnView = CnSettingViewFactory.instance( { parentModel: this } );

        this.cnList.enableDelete( true );
        this.cnList.enableView( true );
      } );
    }
  ] );

} );
