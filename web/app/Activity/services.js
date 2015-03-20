define( [], function() {

  'use strict';

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
      delete object.prototype.add;
      delete object.prototype.delete;
      return { instance: function( params ) { return new object( undefined === params ? {} : params ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnActivitySingleton', [
    'CnBaseSingletonFactory', 'CnActivityListFactory',
    function( CnBaseSingletonFactory, CnActivityListFactory ) {
      var object = function() {
        var base = CnBaseSingletonFactory.instance( {
          subject: 'activity',
          name: {
            singular: 'activity',
            plural: 'activitys',
            possessive: 'activity\'s',
            pluralPossessive: 'activitys\''
          },
          cnList: CnActivityListFactory.instance( { subject: 'activity' } )
        } );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];
      };

      object.prototype = CnBaseSingletonFactory.prototype;
      // don't return a method to create instances, create and return the singleton
      return new object();
    }
  ] );

} );
