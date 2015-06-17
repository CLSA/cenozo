define( {
  subject: 'consent',
  identifier: {
    parent: {
      subject: 'participant',
      column: 'participant.uid'
    }
  },
  name: {
    singular: 'consent',
    plural: 'consents',
    possessive: 'consent\'s',
    pluralPossessive: 'consents\''
  },
  inputList: {
    accept: {
      title: 'Accept',
      type: 'boolean'
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
    }
  },
  columnList: {
    accept: {
      title: 'Accept',
     type: 'boolean'
    },
    written: {
      title: 'Written',
      type: 'boolean'
    },
    date: {
      title: 'Date',
      type: 'date'
    }
  },
  defaultOrder: {
    column: 'date',
    reverse: true
  }
} );
