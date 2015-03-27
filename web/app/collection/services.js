define( [
  cnCenozoUrl + '/app/participant/controllers.js',
  cnCenozoUrl + '/app/participant/directives.js',
  cnCenozoUrl + '/app/participant/services.js'
], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnCollectionAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      return { instance: function( params ) { return CnBaseAddFactory.instance( params ); } };
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
          participant_count: { title: 'Participants' }
        };
        this.order = { column: 'name', reverse: false };
        // factory customizations end here
        //////////////////////////////////

        cnCopyParams( this, params );
      };

      object.prototype = CnBaseListFactory.prototype;
      return { instance: function( params ) { return new object( undefined === params ? {} : params ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnCollectionViewFactory', [
    'CnBaseViewFactory', 'CnParticipantListFactory',
    function( CnBaseViewFactory, CnParticipantListFactory ) {
      var object = function( params ) {
        var base = CnBaseViewFactory.instance( params );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        ////////////////////////////////////
        // factory customizations start here
        var thisRef = this;
        this.cnParticipantList = CnParticipantListFactory.instance( { subject: 'participant' } );
        this.load = function load( id ) {
          thisRef.cnParticipantList.cache = [];
          CnBaseViewFactory.prototype.load.call( this, id ).then( function() {
            thisRef.cnParticipantList.load( 'collection/' + thisRef.record.id + '/participant' );
          } );
        };
        // factory customizations end here
        //////////////////////////////////

        cnCopyParams( this, params );
      }

      object.prototype = CnBaseViewFactory.prototype;
      return { instance: function( params ) { return new object( undefined === params ? {} : params ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnCollectionSingleton', [
    'CnBaseSingletonFactory', 'CnCollectionListFactory', 'CnCollectionAddFactory', 'CnCollectionViewFactory',
    function( CnBaseSingletonFactory, CnCollectionListFactory, CnCollectionAddFactory, CnCollectionViewFactory ) {
      var object = function() {
        var base = CnBaseSingletonFactory.instance( {
          subject: 'collection',
          name: {
            singular: 'collection',
            plural: 'collections',
            possessive: 'collection\'s',
            pluralPossessive: 'collections\''
          },
          cnAdd: CnCollectionAddFactory.instance( { subject: 'collection' } ),
          cnList: CnCollectionListFactory.instance( { subject: 'collection' } ),
          cnView: CnCollectionViewFactory.instance( { subject: 'collection' } )
        } );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];
      };

      object.prototype = CnBaseSingletonFactory.prototype;
      // don't return a method to create instances, create and return the singleton
      return new object();
    }
  ] );

} );
