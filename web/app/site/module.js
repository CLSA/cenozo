define( {
  subject: 'site',
  identifier: {}, // standard
  name: {
    singular: 'site',
    plural: 'sites',
    possessive: 'site\'s',
    pluralPossessive: 'sites\''
  },
  inputList: {
    name: {
      title: 'Name',
      type: 'string'
    },
    timezone: {
      title: 'Time Zone',
      type: 'typeahead',
      typeahead: moment.tz.names()
    },
    title: {
      title: 'Institution',
      type: 'string'
    },
    phone_number: {
      title: 'Phone Number',
      type: 'string'
    },
    address1: {
      title: 'Address1',
      type: 'string'
    },
    address2: {
      title: 'Address2',
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
      type: 'string'
    }
  },
  columnList: {
    name: {
      column: 'site.name',
      title: 'Name'
    },
    role_count: {
      title: 'Roles',
      type: 'number'
    },
    user_count: {
      title: 'Users',
      type: 'number'
    },
    last_access_datetime: {
      title: 'Last Access',
      type: 'datetime'
    }
  },
  defaultOrder: {
    column: 'name',
    reverse: false
  }
} );
