define( {
  subject: 'cohort',
  identifier: { column: 'name' },
  name: {
    singular: 'cohort',
    plural: 'cohorts',
    possessive: 'cohort\'s',
    pluralPossessive: 'cohorts\''
  },
  inputList: {
    // not used
  },
  columnList: {
    name: {
      column: 'cohort.name',
      title: 'Name'
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
