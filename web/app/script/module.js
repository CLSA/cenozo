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
    reserved: {
      title: 'Reserved',
      type: 'boolean',
      help: 'Reserved scripts are not included in the participant script list. ' +
            'Scripts used by application questionnaires should be marked as reserved.'
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
    },
    reserved: {
      title: 'Reserved',
      type: 'boolean'
    }
  },
  defaultOrder: {
    column: 'name',
    reverse: false
  }
} );
