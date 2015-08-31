define( {
  subject: 'phase',
  identifier: {
    parent: {
      subject: 'script',
      column: 'script_id'
    }
  },
  name: {
    singular: 'phase',
    plural: 'phases',
    possessive: 'phase\'s',
    pluralPossessive: 'phases\'',
    friendlyColumn: 'rank'
  },
  inputList: {
    sid: {
      title: 'Survey',
      type: 'enum'
    },
    rank: {
      column: 'phase.rank',
      title: 'Rank',
      type: 'rank'
    },
    repeated: {
      title: 'Repeated',
      type: 'boolean'
    }
  },
  columnList: {
    survey_title: {
      title: 'Name'
    },
    rank: {
      column: 'phase.rank',
      title: 'Rank',
      type: 'rank'
    },
    repeated: {
      title: 'Repeated',
      type: 'boolean'
    }
  },
  defaultOrder: {
    column: 'phase.rank',
    reverse: false
  }
} );
