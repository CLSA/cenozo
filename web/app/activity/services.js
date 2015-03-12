'use strict';

try { var activity = angular.module( 'activity' ); }
catch( err ) { var activity = angular.module( 'activity', [] ); }

/* ######################################################################################################## */
activity.factory( 'CnActivityAddFactory', [
  'CnBaseAddFactory',
  function( CnBaseAddFactory ) {
    return { instance: function( params ) { return CnBaseAddFactory.instance( params ); } };
  }
] );

/* ######################################################################################################## */
activity.factory( 'CnActivityListFactory', [
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
activity.factory( 'CnActivityViewFactory', [
  'CnBaseViewFactory',
  function( CnBaseViewFactory ) {
    return { instance: function( params ) { return CnBaseViewFactory.instance( params ); } };
  }
] );

/* ######################################################################################################## */
activity.factory( 'CnActivitySingleton', [
  'CnBaseSingletonFactory', 'CnActivityListFactory', 'CnActivityAddFactory', 'CnActivityViewFactory', 'CnHttpFactory',
  function( CnBaseSingletonFactory, CnActivityListFactory, CnActivityAddFactory, CnActivityViewFactory, CnHttpFactory ) {
    var object = function() {
      var base = CnBaseSingletonFactory.instance( {
        subject: 'activity',
        name: {
          singular: 'activity',
          plural: 'activities',
          possessive: 'activity\'s',
          pluralPossessive: 'activities\''
        },
        cnAdd: CnActivityAddFactory.instance( { subject: 'activity' } ),
        cnList: CnActivityListFactory.instance( { subject: 'activity' } ),
        cnView: CnActivityViewFactory.instance( { subject: 'activity' } )
      } );
      for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];
    };

    object.prototype = CnBaseSingletonFactory.prototype;
    // don't return a method to create instances, create and return the singleton
    return new object();
  }
] );
