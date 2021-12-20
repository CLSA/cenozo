cenozoApp.defineModule( { name: 'alternate_type', models: ['add', 'list', 'view'], defaultTab: 'alternate', create: module => {

  angular.extend( module, {
    identifier: { column: 'name' },
    name: {
      singular: 'alternate type',
      plural: 'alternate types',
      possessive: 'alternate type\'s'
    },
    columnList: {
      name: { title: 'Name' },
      title: { title: 'Title' },
      participant_count: { title: 'Participants' },
      description: { title: 'Description', align: 'left' },
      // used by the alternate module to determine whether a type can be choosen
      has_role: { isIncluded: function() { return false; } },
      role_count: { isIncluded: function() { return false; } }
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
    title: {
      title: 'Title',
      type: 'string'
    },
    description: {
      title: 'Description',
      type: 'text'
    }
  } );

} } );
