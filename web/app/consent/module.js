define( {
  subject: 'consent',
  name: {
    singular: 'consent',
    plural: 'consents',
    possessive: 'consent\'s',
    pluralPossessive: 'consents\''
  },
  inputList: {
    accept: {
      title: 'Accept',
      type: 'boolean
    },
    written: {
      title: 'Written',
      type: 'boolean'
    },
    date: {
      title: 'Date',
      type: 'date'
    },
    note: {
      title: 'Note',
      type: 'text'
    },
  },
  columnList: {
    accept: {
      title: 'Accept',
      filter: 'cnYesNo'
    },
    written: {
      title: 'Written',
      filter: 'cnYesNo'
    },
    date: {
      title: 'Date',
      filter: 'cnMomentDate:YYYY-MM-DD'
    },
  }
  defaultOrder: {
    column: 'date',
    reverse: true
  } 
} );
