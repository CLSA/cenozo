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
    }
  },
  columnList: {
    first_name: {
      column: 'alternate.first_name',
      title: 'First Name'
    },
    last_name: {
      column: 'alternate.last_name',
      title: 'Last Name'
    },
    association: {
      title: 'Association'
    },
    types: {
      title: 'Types'
    }
  },
  defaultOrder: {
    column: 'last_name',
    reverse: false
  } 
} );
