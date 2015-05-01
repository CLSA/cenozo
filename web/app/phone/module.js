define( {
  subject: 'phone',
  name: {
    singular: 'phone',
    plural: 'phones',
    possessive: 'phone\'s',
    pluralPossessive: 'phones\''
  },
  inputList: {
    address_id: {
      title: 'Associated Address',
      type: 'enum',
      help: 'The address that this phone number is associated with, if any.'
    },
    active: {
      title: 'Active',
      type: 'boolean'
    },
    rank: {
      title: 'Rank',
      type: 'rank'
    },
    type: {
      title: 'Type',
      type: 'enum'
    },
    number: {
      title: 'Number',
      type: 'string',
      help: 'Must be in 000-000-0000 format.'
    },
    note: {
      title: 'Note',
      type: 'text'
    }
  },
  columnList: {
    number: {
      title: 'Number'
    },
    type: {
      title: 'Type'
    },
    active: {
      column: 'phone.active',
      title: 'Active',
      filter: 'cnYesNo'
    },
    rank: {
      title: 'Rank',
      filter: 'cnOrdinal'
    }
  },
  defaultOrder: {
    column: 'rank',
    reverse: false
  }
} );
