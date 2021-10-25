cenozoApp.defineModule( { name: 'source', models: ['add', 'list', 'view'], create: module => {

  angular.extend( module, {
    identifier: { column: 'name' },
    name: {
      singular: 'source',
      plural: 'sources',
      possessive: 'source\'s'
    },
    columnList: {
      name: { title: 'Name' },
      override_stratum: {
        title: 'Override Stratum',
        type: 'boolean'
      },
      participant_count: {
        title: 'Participants',
        type: 'number'
      }
    },
    defaultOrder: {
      column: 'name',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    name: {
      title: 'Name',
      type: 'string'
    },
    override_stratum: {
      title: 'Override Stratum Restrictions',
      type: 'boolean'
    },
    description: {
      title: 'Description',
      type: 'text'
    }
  } );

} } );
