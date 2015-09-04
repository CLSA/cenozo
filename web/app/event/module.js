define( {
  subject: 'event',
  identifier: {
    parent: {
      subject: 'participant',
      column: 'participant.uid'
    }
  },
  name: {
    singular: 'event',
    plural: 'events',
    possessive: 'event\'s',
    pluralPossessive: 'events\''
  },
  inputList: {
    event_type_id: {
      title: 'Event Type',
      type: 'enum'
    },
    datetime: {
      title: 'Date & Time',
      type: 'datetimesecond',
      max: 'now'
    }
  },
  columnList: {
    event_type: {
      column: 'event_type.name',
      title: 'Event Type'
    },
    datetime: {
      title: 'Date & Time',
      type: 'datetimesecond'
    }
  },
  defaultOrder: {
    column: 'datetime',
    reverse: true
  }
} );
