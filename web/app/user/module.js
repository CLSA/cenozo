define( {
  subject: 'user',
  identifier: { column: 'name' },
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
      type: 'string',
      format: 'alpha_num',
      help: 'May only contain numbers, letters and underscores'
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
      type: 'string',
      format: 'email',
      help: 'Must be in the format "account@domain.name" ' +
            '(if not provided then the user will be prompted for an email address the next time they login)'
    },
    timezone: {
      title: 'Timezone',
      type: 'typeahead',
      typeahead: moment.tz.names(),
      help: 'Which timezone the user displays times in'
    },
    use_12hour_clock: {
      title: 'Use 12-Hour Clock',
      type: 'boolean',
      help: 'Whether to display times using the 12-hour clock (am/pm)'
    },
    site_id: {
      title: 'Initial Site',
      type: 'enum',
      help: 'Which site to assign the user to',
      noview: true
    },
    role_id: {
      title: 'Initial Role',
      type: 'enum',
      help: 'Which role to assign the user to',
      noview: true
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
      type: 'boolean'
    },
    first_name: {
      column: 'user.first_name',
      title: 'First'
    },
    last_name: {
      column: 'user.last_name',
      title: 'Last'
    },
    role_count: {
      title: 'Roles',
      type: 'number',
      help: 'The number of roles the user has access to for this application.'
    },
    site_count: {
      title: 'Sites',
      type: 'number',
      help: 'The number of sites the user has access to for this application.'
    },
    last_access_datetime: {
      title: 'Last Access',
      type: 'datetime',
      help: 'The last time the user accessed this application.'
    }
  },
  defaultOrder: {
    column: 'name',
    reverse: false
  }
} );
