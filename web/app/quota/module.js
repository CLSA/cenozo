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
      type: 'enum',
      required: true
    },
    region_id: {
      title: 'Region',
      type: 'enum',
      required: true
    },
    gender: {
      title: 'Sex',
      type: 'enum',
      required: true
    },
    age_group_id: {
      title: 'Age Group',
      type: 'enum',
      required: true
    },
    population: {
      title: 'Population',
      type: 'string',
      required: true
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
