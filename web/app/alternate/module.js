define( {
  subject: 'alternate',
  identifier: {
    parent: {
      subject: 'participant',
      column: 'participant.uid'
    }
  },
  name: {
    singular: 'alternate',
    plural: 'alternates',
    possessive: 'alternate\'s',
    pluralPossessive: 'alternates\''
  },
  inputList: {
    participant_id: {
      column: 'alternate.participant_id',
      title: 'Participant',
      type: 'lookup-typeahead',
      typeahead: {
        table: 'participant',
        select: 'CONCAT( first_name, " ", last_name, " (", uid, ")" )',
        where: [ 'first_name', 'last_name', 'uid' ]
      }
    },
    first_name: {
      column: 'alternate.first_name',
      title: 'First Name',
      type: 'string'
    },
    last_name: {
      column: 'alternate.last_name',
      title: 'Last Name',
      type: 'string'
    },
    association: {
      title: 'Association',
      type: 'string'
    },
    alternate: {
      title: 'Alternate Contact',
      type: 'boolean'
    },
    informant: {
      title: 'Information Provider',
      type: 'boolean'
    },
    proxy: {
      title: 'Decision Maker',
      type: 'boolean'
    }
  },
  columnList: {
    uid: {
      column: 'participant.uid',
      title: 'Participant'
    },
    first_name: {
      column: 'alternate.first_name',
      title: 'First Name'
    },
    last_name: {
      column: 'alternate.last_name',
      title: 'Last Name'
    },
    association: {
      title: 'Association'
    },
    types: {
      title: 'Types'
    }
  },
  defaultOrder: {
    column: 'participant.uid',
    reverse: false
  }
} );
