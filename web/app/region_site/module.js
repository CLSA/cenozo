define( {
  subject: 'region_site',
  identifier: {}, // standard
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
      type: 'enum'
    },
    region_id: {
      column: 'region_site.region_id',
      title: 'Region',
      type: 'enum'
    },
    language_id: {
      column: 'region_site.language_id',
      title: 'Language',
      type: 'enum'
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
