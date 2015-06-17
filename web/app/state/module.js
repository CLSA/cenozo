define( {
  subject: 'state',
  identifier: { column: 'name' },
  name: {
    singular: 'state',
    plural: 'states',
    possessive: 'state\'s',
    pluralPossessive: 'states\''
  },
  inputList: {
    name: {
      title: 'Name',
      type: 'string'
    },
    rank: {
      title: 'Rank',
      type: 'rank'
    },
    description: {
      title: 'Description',
      type: 'text'
    },
    participant_count: {
      title: 'Participants',
      type: 'string',
      constant: true,
      help: 'Participants can only be added to this state by going directly to participant details.'
    }
  },
  columnList: {
    rank: {
      title: 'Rank',
      type: 'rank'
    },
    name: { title: 'Name' },
    participant_count: {
      title: 'Participants',
      type: 'number'
    },
    role_count: {
      title: 'Roles',
      type: 'number'
    }
  },
  defaultOrder: {
    column: 'rank',
    reverse: false
  }
} );
