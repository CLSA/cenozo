define( {
  subject: 'region_site',
  name: {
    singular: 'region site',
    plural: 'region sites',
    possessive: 'region site\'s',
    pluralPossessive: 'region sites\''
  },
  inputList: {
    site_id: {
      column: 'region_site.site_id',
      title: 'Site',
      type: 'enum',
      required: true
    },
    region_id: {
      column: 'region_site.region_id',
      title: 'Region',
      type: 'enum',
      required: true
    },
    language_id: {
      column: 'region_site.language_id',
      title: 'Language',
      type: 'enum',
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
    language: {
      column: 'language.name',
      title: 'Language'
    }
  },
  defaultOrder: {
    column: 'region',
    reverse: false
  }
} );
