define( {
  subject: 'address',
  name: {
    singular: 'address',
    plural: 'addresses',
    possessive: 'address\'',
    pluralPossessive: 'addresses\''
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
      help: 'Postal codes must be in "A1A1A1" format, zip codes in "01234" format.'
    },
    timezone_offset: {
      title: 'Timezone Offset',
      type: 'integer',
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
    city: {
      title: 'City'
    },
    region: {
      column: 'region.name',
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
