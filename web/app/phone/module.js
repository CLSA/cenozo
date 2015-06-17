define( {
  subject: 'phone',
  identifier: {
    parent: [ {
      subject: 'participant',
      column: 'participant.uid'
    }, {
      subject: 'alternate',
      column: 'alternate_id'
    } ]
  },
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
    international: {
      title: 'International',
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
      help: 'If not international then must be in 000-000-0000 format.'
    },
    note: {
      title: 'Note',
      type: 'text'
    }
  },
  columnList: {
    rank: {
      title: 'Rank',
      type: 'rank'
    },
    number: {
      title: 'Number'
    },
    type: {
      title: 'Type'
    },
    active: {
      column: 'phone.active',
      title: 'Active',
      type: 'boolean'
    }
  },
  defaultOrder: {
    column: 'rank',
    reverse: false
  }
} );
