define( {
  subject: 'consent_type',
  identifier: { column: 'name' },
  name: {
    singular: 'consent type',
    plural: 'consent types',
    possessive: 'consent type\'s',
    pluralPossessive: 'consent types\''
  },
  inputList: {
    name: {
      title: 'Name',
      type: 'string'
    },
    description: {
      title: 'Description',
      type: 'string'
    }
  },
  columnList: {
    name: { title: 'Name' },
    accept_count: {
      title: 'Accepts',
      type: 'number'
    },
    deny_count: {
      title: 'Denies',
      type: 'number'
    },
    description: {
      title: 'Description',
      align: 'left'
    }
  },
  defaultOrder: {
    column: 'name',
    reverse: false
  }
} );
