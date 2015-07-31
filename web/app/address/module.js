define( {
  subject: 'address',
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
    singular: 'address',
    plural: 'addresses',
    possessive: 'address\'',
    pluralPossessive: 'addresses\'',
    friendlyColumn: 'rank'
  },
  inputList: {
    active: {
      title: 'Active',
      type: 'boolean'
    },
    rank: {
      title: 'Rank',
      type: 'rank'
    },
    international: {
      title: 'International',
      type: 'boolean',
      help: 'Cannot be changed once the address has been created.',
      noedit: true
    },
    address1: {
      title: 'Address Line 1',
      type: 'string'
    },
    address2: {
      title: 'Address Line 2',
      type: 'string'
    },
    city: {
      title: 'City',
      type: 'string'
    },
    region_id: {
      title: 'Region',
      type: 'enum',
      constant: true,
      help: 'Cannot be changed once the address has been created.'
    },
    postcode: {
      title: 'Postcode',
      type: 'string',
      help: 'Non-international postal codes must be in "A1A1A1" format, zip codes in "01234" format.'
    },
    timezone_offset: {
      title: 'Timezone Offset',
      type: 'string',
      format: 'float',
      help: 'The number of hours difference between the address\' timezone and UTC.'
    },
    daylight_savings: {
      title: 'Daylight Savings',
      type: 'boolean',
      help: 'Whether the address observes daylight savings.'
    },
    note: {
      title: 'Note',
      type: 'text'
    },
    months: {
      title: 'Active Months',
      type: 'months'
    }
  },
  columnList: {
    rank: {
      title: 'Rank',
      type: 'rank'
    },
    city: {
      title: 'City'
    },
    international_region: {
      title: 'Region'
    },
    active: {
      column: 'address.active',
      title: 'Active',
      type: 'boolean'
    },
    available: {
      title: 'Available',
      type: 'boolean'
    }
  },
  defaultOrder: {
    column: 'rank',
    reverse: false
  }
} );
