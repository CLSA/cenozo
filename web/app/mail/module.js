define( [ 'trace' ].reduce( function( list, name ) {
  return list.concat( cenozoApp.module( name ).getRequiredFiles() );
}, [] ), function() {
  'use strict';

  try { var module = cenozoApp.module( 'mail', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'participant',
        column: 'participant.uid'
      }
    },
    name: {
      singular: 'email',
      plural: 'emails',
      possessive: 'email\'s'
    },
    columnList: {
      uid: {
        column: 'participant.uid',
        title: 'Participant'
      },
      schedule_datetime: {
        title: 'Scheduled Date & Time',
        type: 'datetime'
      },
      sent_datetime: {
        title: 'Sent Date & Time',
        type: 'datetime'
      },
      sent: {
        title: 'Sent',
        type: 'boolean'
      },
      title: {
        title: 'Title'
      }
    },
    defaultOrder: {
      column: 'schedule_datetime',
      reverse: true
    }
  } );

  module.addInputGroup( '', {
    participant_id: {
      column: 'mail.participant_id',
      title: 'Participant',
      type: 'lookup-typeahead',
      typeahead: {
        table: 'participant',
        select: 'CONCAT( participant.first_name, " ", participant.last_name, " (", uid, ")" )',
        where: [ 'participant.first_name', 'participant.last_name', 'uid' ]
      },
      isConstant: function( $state, model ) {
        // TODO: make constant when viewing and sent is not null
        return 'mail' != model.getSubjectFromState() || 'view' == model.getActionFromState();
      }
    },
    from_name: {
      title: 'From name',
      type: 'string',
      isConstant: function( $state, model ) {
        return 'view' == model.getActionFromState() && null != model.viewModel.record.sent_datetime;
      }
    },
    from_address: {
      title: 'From Address',
      type: 'string',
      format: 'email',
      help: 'Must be in the format "account@domain.name".',
      isConstant: function( $state, model ) {
        return 'view' == model.getActionFromState() && null != model.viewModel.record.sent_datetime;
      }
    },
    to_name: {
      title: 'To name',
      type: 'string',
      isConstant: function( $state, model ) {
        return 'view' == model.getActionFromState() && null != model.viewModel.record.sent_datetime;
      }
    },
    to_address: {
      title: 'To Address',
      type: 'string',
      format: 'email',
      help: 'Must be in the format "account@domain.name".',
      isConstant: function( $state, model ) {
        return 'view' == model.getActionFromState() && null != model.viewModel.record.sent_datetime;
      }
    },
    cc_address: {
      title: 'Carbon Copy (CC)',
      type: 'string',
      help: 'May be a comma-delimited list of email addresses in the format "account@domain.name".',
      isConstant: function( $state, model ) {
        return 'view' == model.getActionFromState() && null != model.viewModel.record.sent_datetime;
      }
    },
    bcc_address: {
      title: 'Blind Carbon Copy (BCC)',
      type: 'string',
      help: 'May be a comma-delimited list of email addresses in the format "account@domain.name".',
      isConstant: function( $state, model ) {
        return 'view' == model.getActionFromState() && null != model.viewModel.record.sent_datetime;
      }
    },
    schedule_datetime: {
      title: 'Scheduled Date & Time',
      type: 'datetime',
      min: 'now',
      isConstant: function( $state, model ) {
        return 'view' == model.getActionFromState() && null != model.viewModel.record.sent_datetime;
      }
    },
    sent_datetime: {
      title: 'Sent Date & Time',
      type: 'datetime',
      isExcluded: 'add',
      isConstant: true
    },
    sent: {
      title: 'Sent',
      type: 'boolean',
      isExcluded: 'add',
      isConstant: true
    },
    title: {
      title: 'Title',
      type: 'string',
      isConstant: function( $state, model ) {
        return 'view' == model.getActionFromState() && null != model.viewModel.record.sent_datetime;
      }
    },
    body: {
      title: 'Body',
      type: 'text',
      isConstant: function( $state, model ) {
        return 'view' == model.getActionFromState() && null != model.viewModel.record.sent_datetime;
      }
    },
    note: {
      title: 'Note',
      type: 'text'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnMailAdd', [
    'CnMailModelFactory',
    function( CnMailModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnMailModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnMailList', [
    'CnMailModelFactory',
    function( CnMailModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnMailModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnMailView', [
    'CnMailModelFactory',
    function( CnMailModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnMailModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnMailAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnMailListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnMailViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); };
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnMailModelFactory', [
    'CnBaseModelFactory', 'CnMailListFactory', 'CnMailAddFactory', 'CnMailViewFactory',
    'CnHttpFactory',
    function( CnBaseModelFactory, CnMailListFactory, CnMailAddFactory, CnMailViewFactory,
              CnHttpFactory ) {
      var object = function( root ) {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnMailAddFactory.instance( this );
        this.listModel = CnMailListFactory.instance( this );
        this.viewModel = CnMailViewFactory.instance( this, root );

        // only allow mail to be deleted if it hasn't been sent
        this.getDeleteEnabled = function() {
          return this.$$getDeleteEnabled() &&
                 'mail' == this.getSubjectFromState() &&
                 'view' == this.getActionFromState() &&
                 null == this.viewModel.record.sent_datetime;
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
