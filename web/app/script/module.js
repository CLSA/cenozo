define( {
  subject: 'script',
  identifier: { column: 'name' },
  name: {
    singular: 'script',
    plural: 'scripts',
    possessive: 'script\'s',
    pluralPossessive: 'scripts\''
  },
  inputList: {
    name: {
      title: 'Name',
      type: 'string'
    },
    sid: {
      title: 'Survey',
      type: 'enum'
    },
    repeated: {
      title: 'Repeated',
      type: 'boolean'
    },
    description: {
      title: 'Description',
      type: 'text'
    }
  },
  columnList: {
    name: {
      column: 'script.name',
      title: 'Name'
    },
    survey_title: {
      title: 'Name'
    },
    repeated: {
      title: 'Repeated',
      type: 'boolean'
    }
  },
  defaultOrder: {
    column: 'name',
    reverse: false
  }
} );
