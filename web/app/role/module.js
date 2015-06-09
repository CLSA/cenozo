define( {
  subject: 'role',
  identifier: {}, // standard
  name: {
    singular: 'role',
    plural: 'roles',
    possessive: 'role\'s',
    pluralPossessive: 'roles\''
  },
  inputList: {
    // not used
  },
  columnList: {
    name: {
      column: 'role.name',
      title: 'Name'
    },
    user_count: { title: 'Users' }
  },
  defaultOrder: {
    column: 'name',
    reverse: false
  }
} );
