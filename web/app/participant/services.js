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
      var object = function( params ) {
        var base = CnBaseViewFactory.instance( params );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        ////////////////////////////////////
        // factory customizations start here
        this.inputList = {
          active: {
            title: 'Active',
            type: 'boolean'
          },
          uid: {
            title: 'Unique ID',
            type: 'string',
            constant: true
          },
          source_id: {
            title: 'Source',
            type: 'string',
            constant: true
          },
          cohort_id: {
            title: 'Cohort',
            type: 'string',
            constant: true
          },
          first_name: {
            title: 'First Name',
            type: 'string'
          },
          other_name: {
            title: 'Other/Nickname',
            type: 'string'
          },
          last_name: {
            title: 'Last Name',
            type: 'string'
          },
          language_id: {
            title: 'Preferred Language',
            type: 'enum',
            required: false
          },
          default_site: {
            title: 'Default Site',
            type: 'string',
            constant: true
          },
          preferred_site_id: {
            title: 'Preferred Site',
            type: 'enum',
            required: false
          },
          email: {
            title: 'Email',
            type: 'string',
            help: 'Must be in the format "account@domain.name"'
          },
          send_mass_emails: {
            title: 'Send Mass Emails',
            type: 'boolean',
            help: 'Whether the participant wishes to be included in mass emails.'
          },
          sex: {
            title: 'Sex',
            type: 'enum',
            required: true
          },
          date_of_birth: {
            title: 'Date of Birth',
            type: 'date'
          },
          age_group_id: {
            title: 'Age Group',
            type: 'enum',
            required: false
          },
          state_id: {
            title: 'Final State',
            type: 'enum',
            required: false
          },
          withdraw_option: {
            title: 'Withdraw Option',
            type: 'string',
            constant: true
          }
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
  cnCachedProviders.factory( 'CnParticipantSingleton', [
    'CnBaseSingletonFactory', 'CnParticipantListFactory', 'CnParticipantViewFactory',
    function( CnBaseSingletonFactory, CnParticipantListFactory, CnParticipantViewFactory ) {
      var object = function() {
        var base = CnBaseSingletonFactory.instance( {
          subject: moduleSubject,
          name: moduleNames,
          cnList: CnParticipantListFactory.instance( { parentModel: this } ),
          cnView: CnParticipantViewFactory.instance( { parentModel: this } )
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
