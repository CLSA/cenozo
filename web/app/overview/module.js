cenozoApp.defineModule( 'overview', null, ( module ) => {

  angular.extend( module, {
    identifier: { column: 'name' },
    name: {
      singular: 'overview',
      plural: 'overviews',
      possessive: 'overview\'s'
    },
    columnList: {
      title: { title: 'Title' },
      description: {
        title: 'Description',
        align: 'left'
      }
    },
    defaultOrder: {
      column: 'title',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    title: {
      title: 'Title',
      type: 'string'
    },
    description: {
      title: 'Description',
      type: 'text'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnOverviewList', [
    'CnOverviewModelFactory',
    function( CnOverviewModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnOverviewModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnOverviewView', [
    'CnOverviewModelFactory', 'CnSession', '$state', '$interval',
    function( CnOverviewModelFactory, CnSession, $state, $interval ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope, $element ) {
          $scope.refresh = function() {
            if( !$scope.model.viewModel.isLoading ) $scope.model.viewModel.onView();
          };
          $scope.toggleReportTypeDropdown = function() {
            $element.find( '.report-dropdown' ).find( '.dropdown-menu' ).toggle();
          };
          $scope.getReport = async function( format ) {
            await $scope.model.viewModel.onReport( format );
            saveAs( $scope.model.viewModel.reportBlob, $scope.model.viewModel.reportFilename );
            $scope.toggleReportTypeDropdown();
          };
        },
        link: function( scope, element ) {
          if( angular.isUndefined( scope.model ) ) scope.model = CnOverviewModelFactory.root;
          async function update() {
            var trail = [ {
              title: scope.model.module.name.plural.ucWords(),
              go: async function() { await $state.go( '^.list' ); }
            }, {
              title: 'Loading\u2026'
            } ];

            CnSession.setBreadcrumbTrail( trail );
            await scope.model.viewModel.onView();
            trail[1].title = scope.model.viewModel.record.title;
          }
          
          // update immediately, then every minute
          update();
          var promise = $interval( update, 600000 );
          element.on( '$destroy', function() { $interval.cancel( promise ); } );
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnOverviewListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnOverviewViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnOverviewModelFactory', [
    'CnBaseModelFactory', 'CnOverviewListFactory', 'CnOverviewViewFactory',
    function( CnBaseModelFactory, CnOverviewListFactory, CnOverviewViewFactory ) {
      var object = function( root ) {
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnOverviewListFactory.instance( this );
        this.viewModel = CnOverviewViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
