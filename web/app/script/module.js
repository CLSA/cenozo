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
    reserved: {
      title: 'Reserved',
      type: 'boolean'
    },
    phase_count: {
      title: 'Phases',
      type: 'number'
    }
  },
  defaultOrder: {
    column: 'script.name',
    reverse: false
  }
} );
