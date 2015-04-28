define( {
  subject: 'system_message',
  name: {
    singular: 'system message',
    plural: 'system messages',
    possessive: 'system message\'s',
    pluralPossessive: 'system messages\''
  },
  inputList: {
    site_id: {
      title: 'Site',
      type: 'enum', // TODO: Blank for all sites //
      help: 'Leaving the site blank will show the message across all sites.'
    },
    role_id: {
      title: 'Role',
      type: 'enum', // TODO: Blank for all roles //
      help: 'Leaving the site blank will show the message across all roles.'
    },
    title: {
      title: 'Title',
      type: 'string'
    },
    note: {
      title: 'Note',
      type: 'text'
    } 
  },
  columnList: {
    site: {
      column: 'site.name',
      title: 'Site'
    },
    role: {
      column: 'role.name',
      title: 'Role'
    },
    title: {
      column: 'system_message.title',
      title: 'Title'
    }
  },
  defaultOrder: {
    column: 'title',
    reverse: false
  }
} );
