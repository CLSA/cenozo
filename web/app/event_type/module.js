define( {
  subject: 'event_type',
  identifier: {}, // standard
  name: {
    singular: 'event type',
    plural: 'event types',
    possessive: 'event type\'s',
    pluralPossessive: 'event types\''
  },
  inputList: {
    // not used
  },
  columnList: {
    name: { title: 'Name' },
    event_count: {
      title: 'Events',
      type: 'number'
    },
    description: { title: 'Description' }
  },
  defaultOrder: {
    column: 'name',
    reverse: false
  }
} );
