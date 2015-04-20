define( {
  subject: 'application',
  name: {
    singular: 'application',
    plural: 'applications',
    possessive: 'application\'s',
    pluralPossessive: 'applications\''
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
      help: 'Inactive applications will not show as options in reports or to external applications'
    },
    locked: {
      title: 'Locked',
      type: 'boolean',
      required: true,
      help: 'If locked then only users in the access list will be able to make changes to the application'
    },
    description: {
      title: 'Description',
      type: 'text',
      required: false
    }
  },
  columnList: {
    title: { title: 'Title' },
    version: { title: 'Version' },
    release_based: {
      title: 'Release Based',
      filter: 'cnYesNo'
    },
    participant_count: { title: 'Participants' },
    site_count: { title: 'Sites' },
    user_count: { title: 'Users' }
  },
  defaultOrder: {
    column: 'name',
    reverse: false
  }
} );
