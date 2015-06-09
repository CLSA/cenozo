define( {
  subject: 'application',
  identifier: { column: 'name' },
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
    version: {
      title: 'Version',
      type: 'string',
      constant: true
    },
    release_based: {
      title: 'Release Based',
      type: 'boolean',
      help: 'Whether the application only has access to participants once they are released.'
    },
    country: {
      title: 'Country',
      type: 'string'
    },
    language_id: {
      title: 'Default Language',
      type: 'enum'
    },
    timezone: {
      title: 'Default Time Zone',
      type: 'typeahead',
      typeahead: moment.tz.names()
    },
    participant_count: {
      title: 'Participants',
      type: 'string',
      constant: true
    },
    site_count: {
      title: 'Sites',
      type: 'string',
      constant: true
    },
    user_count: {
      title: 'Users',
      type: 'string',
      constant: true
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
