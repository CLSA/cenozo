define( {
  subject: 'age_group',
  identifier: {}, // standard
  name: {
    singular: 'age group',
    plural: 'age groups',
    possessive: 'age group\'s',
    pluralPossessive: 'age groups\''
  },
  inputList: {
    lower: {
      title: 'Lower Age',
      type: 'string',
      format: 'integer',
      minValue: 0
    },
    upper: {
      title: 'Upper Age',
      type: 'string'
      format: 'integer',
      minValue: 0
    },
  },
  columnList: {
    lower: {
      title: 'Lower Age',
      type: 'number'
    },
    upper: {
      title: 'Upper Age',
      type: 'number'
    }
  },
  defaultOrder: {
    column: 'lower',
    reverse: false
  }
} );
