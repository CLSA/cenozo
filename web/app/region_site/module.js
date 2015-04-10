define( {
  subject: 'region_site',
  name: {
    singular: 'region site',
    plural: 'region sites',
    possessive: 'region site\'s',
    pluralPossessive: 'region sites\''
  },
  inputList: {
    // TODO: fill out
  },
  columnList: {
    region: {
      column: 'region.name',
      title: 'Region'
    },
    language: {
      column: 'language.name',
      title: 'Language'
    },
    site: {
      column: 'site.name',
      title: 'Site'
    }
  },
  defaultOrder: {
    column: 'region',
    reverse: false
  }
} );
