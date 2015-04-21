define( {
  subject: 'site',
  name: {
    singular: 'site',
    plural: 'sites',
    possessive: 'site\'s',
    pluralPossessive: 'sites\''
  },
  inputList: {
    // TODO: fill out
  },
  columnList: {
    name: { title: 'Name' },
    role_count: { title: 'Roles' },
    user_count: { title: 'Users' },
    last_access_datetime: {
      title: 'Last Access',
      filter: 'cnMomentDate:"MMM D, YYYY @ HH:mm"'
    }
  },
  defaultOrder: {
    column: 'name',
    reverse: false
  }
} );
