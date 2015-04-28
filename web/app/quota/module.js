define( {
  subject: 'quota',
  name: {
    singular: 'quota',
    plural: 'quotas',
    possessive: 'quota\'s',
    pluralPossessive: 'quotas\''
  },
  inputList: {
    site_id: {
      title: 'Site',
      type: 'enum'
    },
    region_id: {
      title: 'Region',
      type: 'enum'
    },
    gender: {
      title: 'Sex',
      type: 'enum'
    },
    age_group_id: {
      title: 'Age Group',
      type: 'enum'
    },
    population: {
      title: 'Population',
      type: 'string'
    }
  },
  columnList: {
    site: {
      column: 'site.name',
      title: 'Site'
    },
    region: {
      column: 'region.name',
      title: 'Region'
    },
    gender: { title: 'Gender' },
    age_group_range: { title: 'Age Group' },
    population: { title: 'Population' }
  },
  defaultOrder: {
    column: 'site',
    reverse: false
  }
} );
