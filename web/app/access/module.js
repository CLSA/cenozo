define( {
  subject: 'access',
  identifier: {
    parent: [ {
      subject: 'site',
      column: 'site.name'
    }, {
      subject: 'user',
      column: 'user.name'
    } ]
  },
  name: {
    singular: 'access',
    plural: 'accesses',
    possessive: 'access\'',
    pluralPossessive: 'accesses\''
  },
  inputList: {
    user_id: {
      title: 'User',
      type: 'lookup-typeahead',
      typeahead: {
        table: 'user',
        select: 'CONCAT( first_name, " ", last_name, " (", name, ")" )',
        where: [ 'first_name', 'last_name', 'name' ]
      }
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
      type: 'datetimesecond'
    }
  },
  defaultOrder: {
    column: 'user',
    reverse: false
  }
} );
