define( {
  subject: 'access',
  name: {
    singular: 'access',
    plural: 'accesses',
    possessive: 'access\'',
    pluralPossessive: 'accesses\''
  },
  inputList: {
    user_id: {
      title: 'User',
      type: 'typeahead',
      table: 'user',
      select: 'CONCAT( first_name, " ", last_name, " (", name, ")" )',
      where: [ 'first_name', 'last_name', 'name' ]
    },
    role_id: {
      title: 'Role',
      type: 'enum'
    },
    site_id: {
      title: 'Site',
      type: 'enum'
    }
  },
  columnList: {
    user: {
      column: 'user.name',
      title: 'User'
    },
    role: {
      column: 'role.name',
      title: 'Role'
    },
    site: {
      column: 'site.name',
      title: 'Site'
    },
    datetime: {
      title: 'Last Used',
      filter: 'cnMomentDate:"MMM D, YYYY @ HH:mm:ss"'
    }
  },
  defaultOrder: {
    column: 'user.name',
    reverse: false
  }
} );
