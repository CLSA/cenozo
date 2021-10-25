cenozoApp.defineModule( { name: 'writelog', models: 'list', create: module => {

  angular.extend( module, {
    identifier: {}, // standard
    name: {
      singular: 'write operation',
      plural: 'write operations',
      possessive: 'write operation\'s'
    },
    columnList: {
      user: {
        column: 'user.name',
        title: 'User'
      },
      site: {
        column: 'site.name',
        title: 'Site'
      },
      role: {
        column: 'role.name',
        title: 'Role'
      },
      method: {
        title: 'Method'
      },
      path: {
        title: 'Path'
      },
      completed: {
        title: 'Completed',
        type: 'boolean',
        help: 'Whether the operation completed without any errors'
      },
      elapsed: {
        title: 'Elapsed',
        help: 'The time in seconds that the operation took to complete'
      },
      datetime: {
        title: 'Date & Time',
        type: 'datetimesecond'
      }
    },
    defaultOrder: {
      column: 'datetime',
      reverse: true
    }
  } );

} } );
