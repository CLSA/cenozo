define( {
  subject: 'user',
  name: {
    singular: 'user',
    plural: 'users',
    possessive: 'user\'s',
    pluralPossessive: 'users\''
  },
  inputList: {
    name: {
      title: 'Username',
      type: 'string',
      required: true
    },
    password: {
      title: 'Password', /* TODO: necessary for a non-user-input? */
      type: 'string',
      required: false
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
    active: {
      title: 'Active',
      type: 'bolean',
      required: true
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
      filter: 'date:"MMM d, y HH:mm"'
    }
  },
  defaultOrder: {
    column: 'name',
    reverse: false
  }
} );
