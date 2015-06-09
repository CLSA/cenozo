define( {
  subject: 'activity',
  identifier: {}, // standard
  name: {
    singular: 'activity',
    plural: 'activities',
    possessive: 'activity\'s',
    pluralPossessive: 'activities\''
  },
  inputList: {
    // not used
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
      filter: 'cnMomentDate:"MMM D, YYYY @ HH:mm:ss"'
    },
    end_datetime: {
      title: 'End',
      filter: 'cnMomentDate:"MMM D, YYYY @ HH:mm:ss"'
    }
  },
  defaultOrder: {
    column: 'start_datetime',
    reverse: true
  }
} );
