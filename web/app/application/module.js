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
      constant: true
    },
    title: {
      title: 'Title',
      type: 'string',
      help: 'A user-friendly name for the service, may contain any characters.'
    },
    type: {
      title: 'Type',
      type: 'string',
      constant: true
    },
    url: {
      title: 'URL',
      type: 'string',
      help: 'The root web address of the application. This is used for intra-application communication.',
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
    update_queue: {
      title: 'Update Queue',
      type: 'boolean',
      help: 'Whether the application has a queue which should be updated when changes are made to the database.'
    },
    country: {
      title: 'Country',
      type: 'string'
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
      title: 'Released',
      type: 'boolean'
    },
    update_queue: {
      title: 'Queued',
      type: 'boolean'
    },
    participant_count: {
      title: 'Participants',
      type: 'number'
    },
    site_count: {
      title: 'Sites',
      type: 'number'
    },
    user_count: {
      title: 'Users',
      type: 'number'
    }
  },
  defaultOrder: {
    column: 'name',
    reverse: false
  }
} );
