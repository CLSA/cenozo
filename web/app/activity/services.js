define( [], function() {

  'use strict';

  var moduleSubject = 'activity';
  var moduleNames = {
    singular: 'activity',
    plural: 'activities',
    possessive: 'activity\'s',
    pluralPossessive: 'activities\''
  };

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
          user: {
            column: 'user.name',
            title: 'User'
          },
          site: {
            column: 'site.name',
            title: 'Site'
          },
          role: {
            column: 'role.name',
            title: 'Role'
          },
          method: {
            column: 'service.method',
            title: 'Method'
          },
          path: {
            column: 'activity.path',
            title: 'Path'
          },
          elapsed: {
            title: 'Elapsed'
          },
          status: {
            title: 'Status'
          },
          datetime: {
            title: 'Date & Time',
            filter: 'date:"MMM d, y HH:mm:ss"'
          }
        };
        this.order = { column: 'datetime', reverse: true };
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
  cnCachedProviders.factory( 'CnActivitySingleton', [
    'CnBaseSingletonFactory', 'CnActivityListFactory',
    function( CnBaseSingletonFactory, CnActivityListFactory ) {
      var object = function() {
        var base = CnBaseSingletonFactory.instance( {
          subject: moduleSubject,
          name: moduleNames,
          cnList: CnActivityListFactory.instance()
        } );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];
      };

      object.prototype = CnBaseSingletonFactory.prototype;
      // don't return a method to create instances, create and return the singleton
      return new object();
    }
  ] );

} );
