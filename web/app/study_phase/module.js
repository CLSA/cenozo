cenozoApp.defineModule( 'study_phase', null, ( module ) => {

  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'study',
        column: 'study.name'
      }
    },
    name: {
      singular: 'study phase',
      plural: 'study phases',
      possessive: 'study phase\'s'
    },
    columnList: {
      study: { column: 'study.name', title: 'Study' },
      rank: { title: 'Rank', type: 'rank' },
      name: { title: 'Name' },
      code: { title: 'Code' }
    },
    defaultOrder: {
      column: 'study.name',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    name: {
      title: 'Name',
      type: 'string'
    },
    code: {
      title: 'Code',
      type: 'string'
    },
    rank: {
      title: 'Rank',
      type: 'rank'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnStudyPhaseAdd', [
    'CnStudyPhaseModelFactory',
    function( CnStudyPhaseModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnStudyPhaseModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnStudyPhaseList', [
    'CnStudyPhaseModelFactory',
    function( CnStudyPhaseModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnStudyPhaseModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnStudyPhaseView', [
    'CnStudyPhaseModelFactory',
    function( CnStudyPhaseModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnStudyPhaseModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnStudyPhaseAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnStudyPhaseListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnStudyPhaseViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnStudyPhaseModelFactory', [
    'CnBaseModelFactory', 'CnStudyPhaseListFactory', 'CnStudyPhaseAddFactory', 'CnStudyPhaseViewFactory',
    function( CnBaseModelFactory, CnStudyPhaseListFactory, CnStudyPhaseAddFactory, CnStudyPhaseViewFactory ) {
      var object = function( root ) {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnStudyPhaseAddFactory.instance( this );
        this.listModel = CnStudyPhaseListFactory.instance( this );
        this.viewModel = CnStudyPhaseViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
