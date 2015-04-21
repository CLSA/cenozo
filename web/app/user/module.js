define( {
  subject: 'user',
  name: {
    singular: 'user',
    plural: 'users',
    possessive: 'user\'s',
    pluralPossessive: 'users\''
  },
  inputList: {
    active: {
      title: 'Active',
      type: 'boolean',
      required: true
    },
    name: {
      title: 'Username',
      type: 'string',
      required: true
    },
    first_name: {
      title: 'First Name',
      type: 'string',
      required: true
    },
    last_name: {
      title: 'Last Name',
      type: 'string',
      required: true
    },
    email: {
      title: 'Email',
      type: 'string',
      required: false
    }
  },
  columnList: {
    name: {
      column: 'user.name',
      title: 'Name'
    },
    active: {
      column: 'user.active',
      title: 'Active',
      filter: 'cnYesNo'
    },
    first_name: {
      column: 'user.first_name',
      title: 'First'
    },
    last_name: {
      column: 'user.last_name',
      title: 'Last'
    },
    role_count: { title: 'Roles' },
    site_count: { title: 'Sites' },
    last_access_datetime: {
      title: 'Last Access',
      filter: 'cnMomentDate:"MMM D, YYYY HH:mm"'
    }
  },
  defaultOrder: {
    column: 'name',
    reverse: false
  }
} );
