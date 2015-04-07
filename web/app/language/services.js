define( [
  cnCenozoUrl + '/app/user/controllers.js',
  cnCenozoUrl + '/app/user/directives.js',
  cnCenozoUrl + '/app/user/services.js'
], function() {

  'use strict';

  var moduleSubject = 'language';
  var moduleNames = {
    singular: 'language',
    plural: 'languages',
    possessive: 'language\'s',
    pluralPossessive: 'languages\''
  };

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnLanguageListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( params ) {
        var base = CnBaseListFactory.instance( params );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        ////////////////////////////////////
        // factory customizations start here
        this.columnList = {
          name: { title: 'Name' },
          code: { title: 'Code' },
          active: {
            column: 'language.active',
            title: 'Active',
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
  cnCachedProviders.factory( 'CnLanguageViewFactory', [
    'CnBaseViewFactory', 'CnUserListFactory',
    function( CnBaseViewFactory, CnUserListFactory ) {
      var object = function( params ) {
        var base = CnBaseViewFactory.instance( params );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        ////////////////////////////////////
        // factory customizations start here
        this.inputList = {
          name: {
            title: 'Name',
            type: 'constant'
          },
          code: {
            title: 'Code',
            type: 'constant'
          },
          active: {
            title: 'Active',
            type: 'boolean',
            help: 'Setting this to yes will make this language appear in language lists'
          },
          participant_count: {
            title: 'Participants',
            type: 'string',
            constant: true,
            help: 'Participants can only be added to this language by going directly to participant details'
          }
        };
        this.cnUserList = CnUserListFactory.instance( { parentModel: this } );
        this.cnUserList.enableSelect( true );
        var thisRef = this;
        this.load = function load( id ) {
          thisRef.cnUserList.cache = [];
          return CnBaseViewFactory.prototype.load.call( this, id ).then( function() {
            thisRef.cnUserList.load( 'language/' + thisRef.record.id + '/user' );
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
        return new object( params );
      } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnLanguageSingleton', [
    'CnBaseSingletonFactory', 'CnLanguageListFactory', 'CnLanguageViewFactory',
    function( CnBaseSingletonFactory, CnLanguageListFactory, CnLanguageViewFactory ) {
      var object = function() {
        var base = CnBaseSingletonFactory.instance( {
          subject: moduleSubject,
          name: moduleNames,
          cnList: CnLanguageListFactory.instance( { parentModel: this } ),
          cnView: CnLanguageViewFactory.instance( { parentModel: this } )
        } );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        this.cnList.enableView( true );
      };

      object.prototype = CnBaseSingletonFactory.prototype;
      // don't return a method to create instances, create and return the singleton
      return new object();
    }
  ] );

} );
