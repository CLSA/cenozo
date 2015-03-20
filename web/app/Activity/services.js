define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnActivityAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      return { instance: function( params ) { return CnBaseAddFactory.instance( params ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnActivityListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( params ) {
        var base = CnBaseListFactory.instance( params );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        ////////////////////////////////////
        // factory customizations start here
        this.columnList = {
          'user__name': { title: 'User' },
          'site__name': { title: 'Site' },
          'role__name': { title: 'Role' },
          'service__method': { title: 'Method' },
          'service__path': { title: 'Path' },
          'elapsed': { title: 'Elapsed' },
          'status': { title: 'Status' },
          'datetime': { title: 'Date & Time', filter: 'date:"MMM d, y HH:mm"' }
        };
        this.order = { column: 'datetime', reverse: true };
        // factory customizations end here
        //////////////////////////////////

        cnCopyParams( this, params );
      };

      object.prototype = CnBaseListFactory.prototype;
      return { instance: function( params ) { return new object( undefined === params ? {} : params ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnActivityViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      return { instance: function( params ) { return CnBaseViewFactory.instance( params ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnActivitySingleton', [
    'CnBaseSingletonFactory', 'CnActivityListFactory', 'CnActivityAddFactory', 'CnActivityViewFactory',
    function( CnBaseSingletonFactory, CnActivityListFactory, CnActivityAddFactory, CnActivityViewFactory ) {
      var object = function() {
        var base = CnBaseSingletonFactory.instance( {
          subject: 'activity',
          name: {
            singular: 'activity',
            plural: 'activitys',
            possessive: 'activity\'s',
            pluralPossessive: 'activitys\''
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

} );
