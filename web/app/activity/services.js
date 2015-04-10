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
          start_datetime: {
            title: 'Start',
            filter: 'date:"MMM d, y HH:mm:ss"'
          },
          end_datetime: {
            title: 'End',
            filter: 'date:"MMM d, y HH:mm:ss"'
          }
        };
        this.order = { column: 'start_datetime', reverse: true };
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
      return new ( function() {
        this.subject = moduleSubject;
        CnBaseSingletonFactory.apply( this );
        this.name = moduleNames;
        this.cnList = CnActivityListFactory.instance( { parentModel: this } );
      } );
    }
  ] );

} );
