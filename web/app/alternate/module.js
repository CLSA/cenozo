define( {
  subject: 'alternate',
  name: {
    singular: 'alternate',
    plural: 'alternates',
    possessive: 'alternate\'s',
    pluralPossessive: 'alternates\''
  },
  inputList: {
    first_name: {
      title: 'First Name',
      type: 'string'
    },
    last_name: {
      title: 'Last Name',
      type: 'string'
    },
    association: {
      title: 'Association',
      type: 'string'
    },
    alternate: {
      title: 'Alternate',
      type: 'boolean'
    },
    informant: {
      title: 'Information Provider',
      type: 'boolean'
    },
    proxy: {
      title: 'Decision Maker',
      type: 'boolean'
    },
  },
  columnList: {
    name: {
      column: 'CONCAT( first_name, " ", last_name)',
      title: 'Name'
    },
    association: {
      title: 'Association'
    },
    alternate: {
      title: 'Alternate',
      filter: 'cnYesNo'
    },
    informant: {
      title: 'Information Provider',
      filter: 'cnYesNo'
    },
    proxy: {
      title: 'Decision Maker',
      filter: 'cnYesNo'
    },
  }
  defaultOrder: {
    column: 'last_name',
    reverse: false
  } 
} );
