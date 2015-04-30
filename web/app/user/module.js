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
      type: 'boolean'
    },
    name: {
      title: 'Username',
      type: 'string'
    },
    first_name: {
      title: 'First Name',
      type: 'string'
    },
    last_name: {
      title: 'Last Name',
      type: 'string'
    },
    email: {
      title: 'Email',
      type: 'string'
    }
  },
  columnList: {
    name: {
      column: 'user.name',
      title: 'Name',
      filter: 'cnCrop:16'
    },
    active: {
      column: 'user.active',
      title: 'Active',
      filter: 'cnYesNo'
    },
    first_name: {
      column: 'user.first_name',
      title: 'First',
      filter: 'cnCrop:16'
    },
    last_name: {
      column: 'user.last_name',
      title: 'Last',
      filter: 'cnCrop:16'
    },
    role_count: {
      title: 'Roles',
      help: 'The number of roles the user has access to for this application.'
    },
    site_count: {
      title: 'Sites',
      help: 'The number of sites the user has access to for this application.'
    },
    last_access_datetime: {
      title: 'Last Access',
      filter: 'cnMomentDate:"MMM D, YYYY @ HH:mm"',
      help: 'The last time the user accessed this application.'
    }
  },
  defaultOrder: {
    column: 'name',
    reverse: false
  }
} );
