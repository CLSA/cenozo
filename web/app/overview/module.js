cenozoApp.defineModule( { name: 'overview', models: ['list', 'view'], create: module => {

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

} } );
