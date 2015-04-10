define( {
  subject: 'activity',
  name: {
    singular: 'activity',
    plural: 'activities',
    possessive: 'activity\'s',
    pluralPossessive: 'activities\''
  },
  inputList: {
    // TODO: fill out
  },
  columnList: {
    user: {
      column: 'user.name',
      title: 'User'
    },
    site: {
      column: 'site.name',
      title: 'Site'
    },
    role: {
      column: 'role.name',
      title: 'Role'
    },
    start_datetime: {
      title: 'Start',
      filter: 'date:"MMM d, y HH:mm:ss"'
    },
    end_datetime: {
      title: 'End',
      filter: 'date:"MMM d, y HH:mm:ss"'
    }
  },
  defaultOrder: {
    column: 'start_datetime',
    reverse: true
  }
} );
