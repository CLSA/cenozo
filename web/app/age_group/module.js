define( {
  subject: 'age_group',
  name: {
    singular: 'age group',
    plural: 'age groups',
    possessive: 'age group\'s',
    pluralPossessive: 'age groups\''
  },
  inputList: {
    lower: {
      title: 'Lower Age',
      type: 'number'
    },
    upper: {
      title: 'Upper Age',
      type: 'number'
    },
  },
  columnList: {
    lower: {
      title: 'Lower Age',
    },
    upper: {
      title: 'Upper Age',
    }
  },
  defaultOrder: {
    column: 'lower',
    reverse: false
  } 
} );
