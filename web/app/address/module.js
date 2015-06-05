define( {
  subject: 'address',
  name: {
    singular: 'address',
    plural: 'addresses',
    possessive: 'address\'',
    pluralPossessive: 'addresses\''
  },
  inputList: {
    alternate_id: {
      title: 'Alternate',
      type: 'parent'
    },
    participant_id: {
      title: 'Participant',
      type: 'parent'
    },
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
      help: 'Can only be defined when creating a new address.'
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
      type: 'enum'
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
      filter: 'cnOrdinal'
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
      filter: 'cnYesNo'
    },
    available: {
      title: 'Available',
      filter: 'cnYesNo'
    }
  },
  defaultOrder: {
    column: 'rank',
    reverse: false
  }
} );
