define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnParticipantAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      return { instance: function( params ) { return CnBaseAddFactory.instance( params ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnParticipantListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( params ) {
        var base = CnBaseListFactory.instance( params );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        ////////////////////////////////////
        // factory customizations start here
        this.columnList = {
          uid: { title: 'UID' },
          first: {
            column: 'participant.first_name',
            title: 'First'
          },
          last: {
            column: 'participant.last_name',
            title: 'Last'
          },
          active: {
            title: 'Active',
            filter: 'cnYesNo'
          },
          source: {
            column: 'source.name',
            title: 'Source'
          },
          site: {
            column: 'site.name',
            title: 'Site'
          },
        };
        this.order = { column: 'uid', reverse: false };
        // factory customizations end here
        //////////////////////////////////

        cnCopyParams( this, params );
      };

      object.prototype = CnBaseListFactory.prototype;
      return { instance: function( params ) { return new object( undefined === params ? {} : params ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnParticipantViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      return { instance: function( params ) { return CnBaseViewFactory.instance( params ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnParticipantSingleton', [
    'CnBaseSingletonFactory', 'CnParticipantListFactory', 'CnParticipantAddFactory', 'CnParticipantViewFactory',
    function( CnBaseSingletonFactory, CnParticipantListFactory, CnParticipantAddFactory, CnParticipantViewFactory ) {
      var object = function() {
        var base = CnBaseSingletonFactory.instance( {
          subject: 'participant',
          name: {
            singular: 'participant',
            plural: 'participants',
            possessive: 'participant\'s',
            pluralPossessive: 'participants\''
          },
          cnAdd: CnParticipantAddFactory.instance( { subject: 'participant' } ),
          cnList: CnParticipantListFactory.instance( { subject: 'participant' } ),
          cnView: CnParticipantViewFactory.instance( { subject: 'participant' } )
        } );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];
      };

      object.prototype = CnBaseSingletonFactory.prototype;
      // don't return a method to create instances, create and return the singleton
      return new object();
    }
  ] );

} );
