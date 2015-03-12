'use strict';

try { var setting = angular.module( 'setting' ); }
catch( err ) { var setting = angular.module( 'setting', [] ); }

/* ######################################################################################################## */
setting.factory( 'CnSettingAddFactory', [
  'CnBaseAddFactory',
  function( CnBaseAddFactory ) {
    return { instance: function( params ) { return CnBaseAddFactory.instance( params ); } };
  }
] );

/* ######################################################################################################## */
setting.factory( 'CnSettingListFactory', [
  'CnBaseListFactory',
  function( CnBaseListFactory ) {
    var object = function( params ) {
      var base = CnBaseListFactory.instance( params );
      for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

      ////////////////////////////////////
      // factory customizations start here
      this.columnList = {
        id: { title: 'ID' }
      };
      this.order = { column: 'id', reverse: false };
      // factory customizations end here
      //////////////////////////////////

      cnCopyParams( this, params );
    };

    object.prototype = CnBaseListFactory.prototype;
    return { instance: function( params ) { return new object( undefined === params ? {} : params ); } };
  }
] );

/* ######################################################################################################## */
setting.factory( 'CnSettingViewFactory', [
  'CnBaseViewFactory',
  function( CnBaseViewFactory ) {
    return { instance: function( params ) { return CnBaseViewFactory.instance( params ); } };
  }
] );

/* ######################################################################################################## */
setting.factory( 'CnSettingSingleton', [
  'CnBaseSingletonFactory', 'CnSettingListFactory', 'CnSettingAddFactory', 'CnSettingViewFactory', 'CnHttpFactory',
  function( CnBaseSingletonFactory, CnSettingListFactory, CnSettingAddFactory, CnSettingViewFactory, CnHttpFactory ) {
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
