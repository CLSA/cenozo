define( [
  cnCenozoUrl + '/app/participant/controllers.js',
  cnCenozoUrl + '/app/participant/directives.js',
  cnCenozoUrl + '/app/participant/services.js',
  cnCenozoUrl + '/app/user/controllers.js',
  cnCenozoUrl + '/app/user/directives.js',
  cnCenozoUrl + '/app/user/services.js'
], function() {

  'use strict';

  var moduleSubject = 'collection';
  var moduleNames = {
    singular: 'collection',
    plural: 'collections',
    possessive: 'collection\'s',
    pluralPossessive: 'collections\''
  };
  var inputList = {
    name: {
      title: 'Name',
      type: 'string',
      required: true,
      help: 'May only contain letters, numbers and underscores'
    },
    active: {
      title: 'Active',
      type: 'boolean',
      required: true,
      help: 'Inactive collections will not show as options in reports or to external applications'
    },
    locked: {
      title: 'Locked',
      type: 'boolean',
      required: true,
      help: 'If locked then only users in the access list will be able to make changes to the collection'
    },
    description: {
      title: 'Description',
      type: 'text',
      required: false
    }
  };

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnCollectionAddFactory', [
    'CnBaseAddFactory', 'CnHttpFactory',
    function( CnBaseAddFactory, CnHttpFactory ) {
      var object = function( params ) {
        var base = CnBaseAddFactory.instance( params );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        ////////////////////////////////////
        // factory customizations start here
        var thisRef = this;
        CnHttpFactory.instance( {
          path: 'collection'
        } ).head().then(
          function success( response ) {
            var metadata = JSON.parse( response.headers( 'Columns' ) );
            thisRef.createRecord = function() {
              return {
                active: metadata.active.default,
                locked: metadata.locked.default
              };
            };
          },
          function error( response ) { cnFatalError(); }
        );
        // factory customizations end here
        //////////////////////////////////

        cnCopyParams( this, params );
      };

      object.prototype = CnBaseAddFactory.prototype;
      return { instance: function( params ) {
        if( undefined === params ) params = {};
        params.subject = moduleSubject;
        params.name = moduleNames;
        params.inputList = inputList;
        return new object( params );
      } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnCollectionListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( params ) {
        var base = CnBaseListFactory.instance( params );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        ////////////////////////////////////
        // factory customizations start here
        this.columnList = {
          name: { title: 'Name' },
          active: {
            title: 'Active',
            filter: 'cnYesNo'
          },
          locked: {
            title: 'Locked',
            filter: 'cnYesNo'
          },
          participant_count: { title: 'Participants' },
          user_count: { title: 'Users' }
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
  cnCachedProviders.factory( 'CnCollectionViewFactory', [
    'CnBaseViewFactory', 'CnParticipantListFactory', 'CnUserListFactory',
    function( CnBaseViewFactory, CnParticipantListFactory, CnUserListFactory ) {
      var object = function( params ) {
        var base = CnBaseViewFactory.instance( params );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        ////////////////////////////////////
        // factory customizations start here
        this.cnParticipantList = CnParticipantListFactory.instance( { parentModel: this } );
        this.cnParticipantList.enableSelect( true );
        this.cnUserList = CnUserListFactory.instance( { parentModel: this } );
        this.cnUserList.enableSelect( true );
        var thisRef = this;
        this.load = function load( id ) {
          thisRef.cnParticipantList.cache = [];
          thisRef.cnUserList.cache = [];
          return CnBaseViewFactory.prototype.load.call( this, id ).then( function() {
            thisRef.cnParticipantList.load( 'collection/' + thisRef.record.id + '/participant' );
            thisRef.cnUserList.load( 'collection/' + thisRef.record.id + '/user' );
          } );
        };
        // factory customizations end here
        //////////////////////////////////

        cnCopyParams( this, params );
      }

      object.prototype = CnBaseViewFactory.prototype;
      return { instance: function( params ) {
        if( undefined === params ) params = {};
        params.subject = moduleSubject;
        params.name = moduleNames;
        params.inputList = inputList;
        return new object( params );
      } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnCollectionSingleton', [
    'CnBaseSingletonFactory', 'CnCollectionListFactory', 'CnCollectionAddFactory', 'CnCollectionViewFactory',
    function( CnBaseSingletonFactory, CnCollectionListFactory, CnCollectionAddFactory, CnCollectionViewFactory ) {
      var object = function() {
        var base = CnBaseSingletonFactory.instance( {
          subject: moduleSubject,
          name: moduleNames,
          cnAdd: CnCollectionAddFactory.instance( { parentModel: this } ),
          cnList: CnCollectionListFactory.instance( { parentModel: this } ),
          cnView: CnCollectionViewFactory.instance( { parentModel: this } )
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
