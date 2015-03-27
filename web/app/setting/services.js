define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnSettingAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      return { instance: function( params ) { return CnBaseAddFactory.instance( params ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnSettingListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( params ) {
        var base = CnBaseListFactory.instance( params );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        ////////////////////////////////////
        // factory customizations start here
        this.columnList = {
          category: { title: 'Category' },
          name: { title: 'Name' },
          value: { title: 'Default' },
          description: { title: 'Description' },
        };
        this.order = { column: 'category', reverse: false };
        // factory customizations end here
        //////////////////////////////////

        cnCopyParams( this, params );
      };

      object.prototype = CnBaseListFactory.prototype;
      return { instance: function( params ) { return new object( undefined === params ? {} : params ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnSettingViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      return { instance: function( params ) { return CnBaseViewFactory.instance( params ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnSettingSingleton', [
    'CnBaseSingletonFactory', 'CnSettingListFactory', 'CnSettingAddFactory', 'CnSettingViewFactory',
    function( CnBaseSingletonFactory, CnSettingListFactory, CnSettingAddFactory, CnSettingViewFactory ) {
      var object = function() {
        var base = CnBaseSingletonFactory.instance( {
          subject: 'setting',
          name: {
            singular: 'setting',
            plural: 'settings',
            possessive: 'setting\'s',
            pluralPossessive: 'settings\''
          },
          cnAdd: CnSettingAddFactory.instance( { subject: 'setting' } ),
          cnList: CnSettingListFactory.instance( { subject: 'setting' } ),
          cnView: CnSettingViewFactory.instance( { subject: 'setting' } )
        } );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];
      };

      object.prototype = CnBaseSingletonFactory.prototype;
      // don't return a method to create instances, create and return the singleton
      return new object();
    }
  ] );

} );
