define( [], function() {

  'use strict';

  var moduleSubject = 'user';
  var moduleNames = {
    singular: 'user',
    plural: 'users',
    possessive: 'user\'s',
    pluralPossessive: 'users\''
  };

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnUserAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      return { instance: function( params ) {
        if( undefined === params ) params = {};
        params.subject = moduleSubject;
        params.name = moduleNames;
        return CnBaseAddFactory.instance( params );
      } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnUserListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( params ) {
        var base = CnBaseListFactory.instance( params );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        ////////////////////////////////////
        // factory customizations start here
        this.columnList = {
          name: {
            column: 'user.name',
            title: 'Name'
          },
          active: {
            column: 'user.active',
            title: 'Active',
            filter: 'cnYesNo'
          },
          first_name: {
            column: 'user.first_name',
            title: 'First'
          },
          last_name: {
            column: 'user.last_name',
            title: 'Last'
          },
          last_datetime: {
            title: 'Last Activity',
            filter: 'date:"MMM d, y HH:mm"'
          }
        };
        this.order = { column: 'name', reverse: false };
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
  cnCachedProviders.factory( 'CnUserViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      return { instance: function( params ) {
        if( undefined === params ) params = {};
        params.subject = moduleSubject;
        params.name = moduleNames;
        return CnBaseViewFactory.instance( params );
      } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnUserSingleton', [
    'CnBaseSingletonFactory', 'CnUserListFactory', 'CnUserAddFactory', 'CnUserViewFactory',
    function( CnBaseSingletonFactory, CnUserListFactory, CnUserAddFactory, CnUserViewFactory ) {
      var object = function() {
        var base = CnBaseSingletonFactory.instance( {
          subject: moduleSubject,
          name: moduleNames,
          cnAdd: CnUserAddFactory.instance( { parentModel: this } ),
          cnList: CnUserListFactory.instance( { parentModel: this } ),
          cnView: CnUserViewFactory.instance( { parentModel: this } )
        } );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        this.cnList.enableAdd( true );
        this.cnList.enableDelete( true );
        this.cnList.enableView( true );
      };

      object.prototype = CnBaseSingletonFactory.prototype;
      // don't return a method to create instances, create and return the singleton
      return new object();
    }
  ] );

} );
