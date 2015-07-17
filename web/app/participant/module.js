define( {
  subject: 'participant',
  identifier: { column: 'uid' },
  name: {
    singular: 'participant',
    plural: 'participants',
    possessive: 'participant\'s',
    pluralPossessive: 'participants\''
  },
  inputList: {
    active: {
      title: 'Active',
      type: 'boolean',
      help: 'Participants can be deactivated so that they are not included in reports, interviews, etc. ' +
            'Deactivating a participant should only ever be used on a temporary basis. If a participant ' +
            'is to be permanently discontinued from the interview process then select a condition (below) ' +
            'instead.'
    },
    uid: {
      title: 'Unique ID',
      type: 'string',
      constant: true
    },
    source: {
      column: 'source.name',
      title: 'Source',
      type: 'string',
      constant: true
    },
    cohort: {
      column: 'cohort.name',
      title: 'Cohort',
      type: 'string',
      constant: true
    },
    honorific: {
      title: 'Honorific',
      type: 'string',
      help: 'English examples: Mr. Mrs. Miss Ms. Dr. Prof. Br. Sr. Fr. Rev. Pr.  ' +
            'French examples: M. Mme Dr Dre Prof. F. Sr P. Révérend Pasteur Pasteure Me'
    },
    first_name: {
      title: 'First Name',
      type: 'string'
    },
    other_name: {
      title: 'Other/Nickname',
      type: 'string'
    },
    last_name: {
      title: 'Last Name',
      type: 'string'
    },
    language_id: {
      title: 'Preferred Language',
      type: 'enum'
    },
    default_site: {
      column: 'default_site.name',
      title: 'Default Site',
      type: 'string',
      constant: true,
      help: 'The site the participant belongs to if a preferred site is not set.'
    },
    preferred_site_id: {
      column: 'preferred_site.id',
      title: 'Preferred Site',
      type: 'enum',
      help: 'If set then the participant will be assigned to this site instead of the default site.'
    },
    email: {
      title: 'Email',
      type: 'string',
      format: 'email',
      help: 'Must be in the format "account@domain.name".'
    },
    mass_email: {
      title: 'Mass Emails',
      type: 'boolean',
      help: 'Whether the participant wishes to be included in mass emails such as newsletters, ' +
            'holiday greetings, etc.'
    },
    sex: {
      title: 'Sex',
      type: 'enum'
    },
    date_of_birth: {
      title: 'Date of Birth',
      type: 'date',
      max: 'now'
    },
    age_group_id: {
      title: 'Age Group',
      type: 'enum'
    },
    state_id: {
      title: 'Condition',
      type: 'enum',
      help: 'A condition defines the reason that a participant should no longer be contacted. ' +
            'If this value is not empty then the participant will no longer be contacted for interviews.'
    },
    withdraw_option: {
      title: 'Withdraw Option',
      type: 'string',
      constant: true
    }
  },
  columnList: {
    uid: {
      column: 'participant.uid',
      title: 'UID'
    },
    first: {
      column: 'participant.first_name',
      title: 'First'
    },
    last: {
      column: 'participant.last_name',
      title: 'Last'
    },
    active: {
      column: 'participant.active',
      title: 'Active',
      type: 'boolean'
    },
    source: {
      column: 'source.name',
      title: 'Source'
    },
    cohort: {
      column: 'cohort.name',
      title: 'Cohort'
    },
    site: {
      column: 'site.name',
      title: 'Site'
    }
  },
  defaultOrder: {
    column: 'uid',
    reverse: false
  }
} );
