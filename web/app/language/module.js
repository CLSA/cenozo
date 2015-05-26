define( {
  subject: 'language',
  name: {
    singular: 'language',
    plural: 'languages',
    possessive: 'language\'s',
    pluralPossessive: 'languages\''
  },
  inputList: {
    name: {
      title: 'Name',
      type: 'string',
      constant: true
    },
    code: {
      title: 'Code',
      type: 'string',
      constant: true
    },
    active: {
      title: 'Active',
      type: 'boolean',
      help: 'Setting this to yes will make this language appear in language lists.'
    },
    participant_count: {
      title: 'Participants',
      type: 'string',
      constant: true,
      help: 'Participants can only be added to this language by going directly to participant details.'
    }
  },
  columnList: {
    name: { title: 'Name' },
    code: { title: 'Code' },
    active: {
      column: 'language.active',
      title: 'Active',
      filter: 'cnYesNo'
    },
    participant_count: { title: 'Participants' },
    user_count: { title: 'Users' }
  },
  defaultOrder: {
    column: 'active',
    reverse: true
  }
} );
