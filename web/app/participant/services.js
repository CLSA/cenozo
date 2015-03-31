define( [], function() {

  'use strict';

  var moduleSubject = 'participant';
  var moduleNames = {
    singular: 'participant',
    plural: 'participants',
    possessive: 'participant\'s',
    pluralPossessive: 'participants\''
  };

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnParticipantAddFactory', [
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
  cnCachedProviders.factory( 'CnParticipantListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( params ) {
        var base = CnBaseListFactory.instance( params );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        ////////////////////////////////////
        // factory customizations start here
        this.columnList = {
          uid: {
            column: 'participant.uid',
            title: 'UID'
          },
          first: {
            column: 'participant.first_name',
            title: 'First'
          },
          last: {
            column: 'participant.last_name',
            title: 'Last'
          },
          active: {
            column: 'participant.active',
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
          }
        };
        this.order = { column: 'uid', reverse: false };
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
  cnCachedProviders.factory( 'CnParticipantViewFactory', [
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
  cnCachedProviders.factory( 'CnParticipantSingleton', [
    'CnBaseSingletonFactory', 'CnParticipantListFactory', 'CnParticipantAddFactory', 'CnParticipantViewFactory',
    function( CnBaseSingletonFactory, CnParticipantListFactory, CnParticipantAddFactory, CnParticipantViewFactory ) {
      var object = function() {
        var base = CnBaseSingletonFactory.instance( {
          subject: moduleSubject,
          name: moduleNames,
          cnAdd: CnParticipantAddFactory.instance(),
          cnList: CnParticipantListFactory.instance(),
          cnView: CnParticipantViewFactory.instance()
        } );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];
      };

      object.prototype = CnBaseSingletonFactory.prototype;
      // don't return a method to create instances, create and return the singleton
      return new object();
    }
  ] );

} );
