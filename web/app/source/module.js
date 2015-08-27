define( {
  subject: 'source',
  identifier: { column: 'name' },
  name: {
    singular: 'source',
    plural: 'sources',
    possessive: 'source\'s',
    pluralPossessive: 'sources\''
  },
  inputList: {
    name: {
      title: 'Name',
      type: 'string'
    },
    override_quota: {
      title: 'Override Quota',
      type: 'boolean'
    },
    description: {
      title: 'Description',
      type: 'text'
    }
  },
  columnList: {
    name: { title: 'Name' },
    override_quota: {
      title: 'Override Quota',
      type: 'boolean'
    },
    participant_count: {
      title: 'Participants',
      type: 'number'
    }
  },
  defaultOrder: {
    column: 'name',
    reverse: false
  }
} );
