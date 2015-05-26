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
      help: 'May only contain letters, numbers and underscores.'
    },
    title: {
      title: 'Title',
      type: 'string',
      help: 'A user-friendly name for the service, may contain any characters.'
    },
    language_id: {
      title: 'Default Language',
      type: 'enum'
    },
    version: {
      title: 'Version',
      type: 'string',
      constant: true
    },
    release_based: {
      title: 'Release Based',
      type: 'boolean',
      help: 'Whether the application only has access to participants once they are released.'
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
