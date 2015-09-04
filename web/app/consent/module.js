define( {
  subject: 'consent',
  identifier: {
    parent: {
      subject: 'participant',
      column: 'participant.uid'
    }
  },
  name: {
    singular: 'consent',
    plural: 'consents',
    possessive: 'consent\'s',
    pluralPossessive: 'consents\'',
    friendlyColumn: 'date'
  },
  inputList: {
    consent_type_id: {
      title: 'Consent Type',
      type: 'enum',
      noedit: true
    },
    accept: {
      title: 'Accept',
      type: 'boolean',
      noedit: true
    },
    written: {
      title: 'Written',
      type: 'boolean',
      noedit: true
    },
    date: {
      title: 'Date',
      type: 'date',
      max: 'now'
    },
    note: {
      title: 'Note',
      type: 'text'
    }
  },
  columnList: {
    consent_type: {
      column: 'consent_type.name',
      title: 'Consent Type'
    },
    accept: {
      title: 'Accept',
     type: 'boolean'
    },
    written: {
      title: 'Written',
      type: 'boolean'
    },
    date: {
      title: 'Date',
      type: 'date'
    }
  },
  defaultOrder: {
    column: 'date',
    reverse: true
  }
} );
