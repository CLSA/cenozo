'use strict';

/* ######################################################################################################## */
function CnBaseAddCtrl( $scope, singleton, createRecordFn ) {
  // initialization function
  if( undefined === createRecordFn ) createRecordFn = function() { return {}; };

  // define properties
  $scope.local = singleton;
  $scope.record = createRecordFn();

  // define callbacks
  $scope.cbSubmit = function( record ) {
    $scope.local.cnList.add( record ).then(
      function success( response ) {
        $scope.record = createRecordFn();
        $scope.form.$setPristine();
        $scope.local.cnAdd.show = false;
      },
      function error( response ) {
        if( 409 == response.status ) {
          // report which inputs are included in the conflict
          for( var i = 0; i < response.data.length; i++ ) {
            $scope.form[response.data[i]].$invalid = true;
            $scope.form[response.data[i]].$error.conflict = true;
          }
        } else { window.broken(); }
      }
    );
  }
}

/* ######################################################################################################## */
function CnBaseListCtrl( $scope, singleton, modalFactory ) {
  // define scope variables
  $scope.local = singleton;

  // define the callbacks
  $scope.cbAdd = function() {
    $scope.local.cnAdd.show = true;
  };
  $scope.cbDelete = function( id ) {
    $scope.local.cnList.delete( id ).catch( function error( response ) { window.broken(); } );
  };
  $scope.cbOrderBy = function( column ) {
    $scope.local.cnList.orderBy( column );
  };
  $scope.cbAddRestrict = function( column ) {
    var modal = modalFactory.instance( {
      subject: $scope.local.subject.singular,
      column: $scope.local.cnList.columnList[column].title,
      comparison: $scope.local.cnList.columnList[column].restrict
    } ).show();
    modal.result.then( function( comparison ) {
      $scope.local.cnList.restrict( column, comparison );
    } );
  };
  $scope.cbDeleteRestrict = function( column ) {
    $scope.local.cnList.restrict( column );
  };
  $scope.cbView = function( id ) {
    $scope.local.view( id );
    $scope.local.cnView.show = true;
  };

  // initialization
  $scope.local.cnList.load().catch( function exception() { window.broken(); } );
}

/* ######################################################################################################## */
function CnBaseViewCtrl( $scope, singleton ) {
  // define scope variables
  $scope.local = singleton;

  $scope.cbDelete = function() {
    $scope.local.cnList.delete( $scope.local.cnView.record.id ).then(
      function success( response ) { $scope.local.cnView.show = false; },
      function error( response ) { window.broken(); }
    );
  }
  $scope.cbPatch = function( property ) {
    // send patch to server then edit the cenozo
    var data = {};
    data[property] = $scope.local.cnView.record[property];
    if( undefined !== data[property] ) {
      $scope.local.cnView.patch( $scope.local.cnView.record.id, data ).then(
        function success( response ) {
          for( var i = 0; i < $scope.form.length; i++ ) {
            if( $scope.form[i].$error.conflict ) {
              $scope.form[i].$invalid = false;
              $scope.form[i].$error.conflict = false;
            }
          }
        },
        function error( response ) {
          if( 409 == response.status ) {
            // report which inputs are included in the conflict
            for( var i = 0; i < response.data.length; i++ ) {
              $scope.form[response.data[i]].$invalid = true;
              $scope.form[response.data[i]].$error.conflict = true;
            }
          } else { window.broken(); }
        }
      );
    }
  }
}
