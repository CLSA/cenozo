cenozoApp.defineModule( { name: 'participant_identifier', models: ['add', 'list', 'view'], create: module => {

  angular.extend( module, {
    identifier: {
      parent: [ {
        subject: 'identifier',
        column: 'identifier.name'
      }, {
        subject: 'participant',
        column: 'participant.uid'
      } ]
    },
    name: {
      singular: 'participant identifier',
      plural: 'participant identifiers',
      possessive: 'participant identifier\'s'
    },
    columnList: {
      identifier: { column: 'identifier.name', title: 'Identifier' },
      uid: { column: 'participant.uid', title: 'UID' },
      value: { title: 'Value' }
    },
    defaultOrder: {
      column: 'participant.uid',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    participant_id: {
      column: 'participant_identifier.participant_id',
      title: 'Participant',
      type: 'lookup-typeahead',
      typeahead: {
        table: 'participant',
        select: 'CONCAT( participant.first_name, " ", participant.last_name, " (", uid, ")" )',
        where: [ 'participant.first_name', 'participant.last_name', 'uid' ]
      }
    },
    value: { type: 'string', title: 'Value' },
    locked: { column: 'identifier.locked', type: 'hidden' }
  } );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnParticipantIdentifierModelFactory', [
    'CnBaseModelFactory',
    'CnParticipantIdentifierAddFactory', 'CnParticipantIdentifierListFactory', 'CnParticipantIdentifierViewFactory',
    function( CnBaseModelFactory,
              CnParticipantIdentifierAddFactory, CnParticipantIdentifierListFactory, CnParticipantIdentifierViewFactory ) {
      var object = function( root ) {
        CnBaseModelFactory.construct( this, module );

        angular.extend( this, {
          addModel: CnParticipantIdentifierAddFactory.instance( this ),
          listModel: CnParticipantIdentifierListFactory.instance( this ),
          viewModel: CnParticipantIdentifierViewFactory.instance( this, root ),
          getEditEnabled: function() { return this.$$getEditEnabled() && !this.viewModel.record.locked; },
          getDeleteEnabled: function() { return false; } // is overridden by identifier module
        } );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} } );
