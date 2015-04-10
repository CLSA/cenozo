define( {
  subject: 'collection',
  name: {
    singular: 'collection',
    plural: 'collections',
    possessive: 'collection\'s',
    pluralPossessive: 'collections\''
  },
  inputList: {
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
  },
  columnList: {
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
  },
  defaultOrder: {
    column: 'name',
    reverse: false
  }
} );
