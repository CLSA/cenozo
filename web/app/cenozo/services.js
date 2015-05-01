'use strict';

try { var cenozo = angular.module( 'cenozo' ); }
catch( err ) { var cenozo = angular.module( 'cenozo', [] ); }

/* ######################################################################################################## */
cenozo.factory( 'CnAppSingleton', [
  'CnHttpFactory',
  function( CnHttpFactory ) {
    return new ( function() {
      this.promise = null;
      this.application = {};
      this.user = {};
      this.site = {};
      this.role = {};
      this.siteList = [];

      // get the application, user, site and role details
      var thisRef = this;
      this.promise = CnHttpFactory.instance( {
        path: 'self/0'
      } ).get().then( function success( response ) {
        thisRef.application = response.data.application;
        thisRef.user = response.data.user;
        thisRef.site = response.data.site;
        thisRef.role = response.data.role;
        cnConvertFromDatabaseRecord( thisRef.user.last_activity );

        // process access records
        for( var i = 0; i < response.data.access.length; i++ ) {
          var access = response.data.access[i];

          // get the site's index
          var index = 0;
          for( ; index < thisRef.siteList.length; index++ )
            if( access.site_id == thisRef.siteList[index].id ) break;

          // if the site isn't found, add it to the list
          if( thisRef.siteList.length == index )
            thisRef.siteList.push( { id: access.site_id, name: access.site_name, roleList: [] } );

          // now add the role to the site's role list
          thisRef.siteList[index].roleList.push( {
            id: access.role_id,
            name: access.role_name
          } );
        }
      } ).catch( function exception() { cnFatalError(); } );

      this.setSite = function setSite( id ) {
        return CnHttpFactory.instance( {
          path: 'self/0',
          data: { site: { id: id } }
        } ).patch();
      };

      this.setRole = function setRole( id ) {
        return CnHttpFactory.instance( {
          path: 'self/0',
          data: { role: { id: id } }
        } ).patch();
      };
    } );
  }
] );

/* ######################################################################################################## */
// TODO: replace with "apply" model as in base singleton factory? (no params processed here)
cenozo.factory( 'CnBaseAddFactory', [
  '$state', '$stateParams',
  function( $state, $stateParams ) {
    var object = function( params ) {
      if( undefined === params.parentModel ) throw 'Tried to create CnBaseAddFactory without a parent model';
      if( undefined === params.subject ) throw 'Tried to create CnBaseAddFactory without a subject';
      if( undefined === params.name ) throw 'Tried to create CnBaseAddFactory without a name';
      if( undefined === params.inputList ) throw 'Tried to create CnBaseAddFactory without an input list';

      this.subject = null;
      this.name = {
        singular: '(undefined)',
        plural: '(undefined)',
        possessive: '(undefined)',
        pluralPossessive: '(undefined)'
      };
      this.inputList = [];

      cnCopyParams( this, params );

      // get pre-defined values from the state
      var preDefinedColumn = null;
      var preDefinedId = null;
      var stateNameParts = $state.current.name.split( '.' );
      if( 1 < stateNameParts.length ) {
        var actionParts = stateNameParts[1].split( '_' );
        if( 2 == actionParts.length && 'add' == actionParts[0] && this.subject == actionParts[1] ) {
          preDefinedColumn = stateNameParts[0] + '_id';
          preDefinedId = $stateParams.parentId;

          // remove the column from the input list
          delete this.inputList[preDefinedColumn];
        }
      }

      var thisRef = this;
      this.parentModel.promise.then( function() {
        thisRef.createRecord = function() {
          var record = {};

          // apply default values from the metadata
          for( var column in thisRef.parentModel.metadata.columnList )
            if( null !== thisRef.parentModel.metadata.columnList[column].default )
              record[column] = thisRef.parentModel.metadata.columnList[column].default;

          // apply pre-defined values from the state
          if( null !== preDefinedColumn && null !== preDefinedId ) record[preDefinedColumn] = preDefinedId;

          return record;
        };
      } );
    };

    object.prototype = {};

    return {
      instance: function( params ) { return new object( undefined === params ? {} : params ); },
      prototype: object.prototype
    };
  }
] );

/* ######################################################################################################## */
// TODO: replace with "apply" model as in base singleton factory? (no params processed here)
cenozo.factory( 'CnBaseListFactory', [
  'CnPaginationFactory', 'CnHttpFactory',
  function( CnPaginationFactory, CnHttpFactory ) {
    var object = function( params ) {
      if( undefined === params.parentModel ) throw 'Tried to create CnBaseListFactory without a parent model';
      if( undefined === params.subject ) throw 'Tried to create CnBaseListFactory without a subject';
      if( undefined === params.name ) throw 'Tried to create CnBaseListFactory without a name';

      this.parentModel = null;
      this.subject = null;
      this.name = {
        singular: '(undefined)',
        plural: '(undefined)',
        possessive: '(undefined)',
        pluralPossessive: '(undefined)'
      };
      this.columnList = {};
      this.total = 0;
      this.order = {};
      this.listPath = null;
      this.cache = [];
      this.cnPagination = CnPaginationFactory.instance();
      this.loading = false;

      this.addEnabled = false;
      this.deleteEnabled = false;
      this.selectEnabled = false;
      this.viewEnabled = false;

      cnCopyParams( this, params );
    };

    object.prototype = {
      enableAdd: function( enable ) {
        if( enable != this.addEnabled ) {
          this.addEnabled = enable;
          if( enable ) {
            this.add = function( record ) {
              var thisRef = this;
              cnConvertToDatabaseRecord( record );
              return CnHttpFactory.instance( {
                path: this.subject,
                data: record
              } ).post().then( function success( response ) {
                record.id = response.data;
                thisRef.cache.unshift( record );
                thisRef.total++;
              } );
            };
          } else {
            delete this.add;
          }
        }
      },

      enableDelete: function( enable ) {
        if( enable != this.deleteEnabled ) {
          this.deleteEnabled = enable;
          if( enable ) {
            this.delete = function( id ) {
              var thisRef = this;
              return CnHttpFactory.instance( {
                path: this.subject + '/' + id
              } ).delete().then( function success( response ) {
                for( var i = 0; i < thisRef.cache.length; i++ ) {
                  if( thisRef.cache[i].id == id ) {
                    thisRef.total--;
                    return thisRef.cache.splice( i, 1 );
                  }
                }
              } );
            };
          } else {
            delete this.delete;
          }
        }
      },

      enableSelect: function( enable ) {
        if( enable != this.selectEnabled ) {
          this.selectEnabled = enable;
          if( enable ) {
            this.selectMode = false;
            this.toggleSelectMode = function() {
              this.selectMode = !this.selectMode;
              this.reload();
            };
            this.select = function( record ) {
              return record.selected ?
                CnHttpFactory.instance( { path: this.listPath + '/' + record.id } ).delete().
                  then( function success( response ) { record.selected = 0; } ) :
                CnHttpFactory.instance( { path: this.listPath, data: record.id } ).post().
                  then( function success( response ) { record.selected = 1; } );
            };
          } else {
            delete this.selectMode;
            delete this.toggleSelectMode;
            delete this.select;
          }
        }
      },

      enableView: function( enable ) {
        if( enable != this.viewEnabled ) {
          this.viewEnabled = enable;
          if( enable ) {
          } else {
          }
        }
      },

      orderBy: function( column ) {
        if( null === this.order || column != this.order.column ) {
          this.order = { column: column, reverse: false };
        } else {
          this.order.reverse = !this.order.reverse;
        }
        if( this.cache.length < this.total ) this.reload();
        this.cnPagination.currentPage = 1;
      },

      restrict: function( column, restrict ) {
        if( undefined === restrict ) {
          if( undefined !== this.columnList[column].restrict ) delete this.columnList[column].restrict;
        } else {
          this.columnList[column].restrict = restrict;
        }
        this.reload();
        this.cnPagination.currentPage = 1;
      },

      checkCache: function() {
        if( this.cache.length < this.total && this.cnPagination.getMaxIndex() >= this.cache.length )
          this.load( this.listPath ).catch( function exception() { cnFatalError(); } );
      },

      reload: function() {
        return this.load( this.listPath, true );
      },

      load: function( path, replace ) {
        if( undefined === replace ) replace = false;
        this.listPath = undefined === path || null === path ? this.subject : path;
        if( replace ) this.cache = [];

        // set up the select, join and where list based on the column list
        var selectList = [];
        var joinList = [];
        var whereList = [];
        for( var key in this.columnList ) {
          var lastJoin = null;
          var parentTable = this.subject;
          var columnParts = undefined === this.columnList[key].column
                          ? [ key ]
                          : this.columnList[key].column.split( '.' );
          for( var k = 0; k < columnParts.length; k++ ) {
            if( k == columnParts.length - 1 ) {
              // add this column to the select list
              var select = { column: columnParts[k], alias: key };
              if( 0 < k ) select.table = columnParts[k-1];
              else select.table_prefix = false;
              selectList.push( select );
            } else { // part of table list
              var table = columnParts[k];

              // don't join a table to itself
              if( table !== parentTable ) {
                var onleft = parentTable + '.' + table + '_id';
                var onright = table + '.id';

                // see if the join to this table already exists
                var join = null;
                for( var j = 0; j < joinList.length; j++ ) {
                  if( joinList[j].table == table &&
                      joinList[j].onleft == onleft &&
                      joinList[j].onright == onright ) {
                    join = joinList[j];
                    break;
                  }
                }

                // if the join wasn't found then add it to the list
                if( null === join ) {
                  join = { table: table, onleft: onleft, onright: onright };
                  joinList.push( join );
                }

                var lastJoin = join;
                var parentTable = table;
              }
            }
          }

          if( undefined !== this.columnList[key].restrict && null !== this.columnList[key].restrict ) {
            var test = this.columnList[key].restrict.test;
            var value = this.columnList[key].restrict.value;
            if( 'like' == test || 'not like' == test ) value = '%' + value + '%';
            
            // determine the column name
            var column = key;
            if( undefined !== this.columnList[key].column ) {
              var columnParts = this.columnList[key].column.split( '.' );
              var len = columnParts.length;
              column = this.columnList[key].column;
              if( 2 < len ) column = columnParts[len-2] + '.' + columnParts[len-1];
            }

            whereList.push( { 
              column: column,
              operator: test,
              value: value
            } );
          }
        }

        var data = { modifier: { offset: replace ? 0 : this.cache.length } };
        if( 0 < selectList.length ) data.select = { column: selectList };
        if( 0 < joinList.length ) data.modifier.join = joinList;
        if( 0 < whereList.length ) data.modifier.where = whereList;
        if( this.selectEnabled && this.selectMode ) data.select_mode = 1;

        // set up the offset and sorting
        if( null !== this.order ) {
          // add the table prefix to the column if there isn't already a prefix
          var column = this.order.column;
          data.modifier.order = {};
          data.modifier.order[column] = this.order.reverse;
        }

        data.modifier = JSON.stringify( data.modifier );

        this.loading = true;
        var thisRef = this;
        return CnHttpFactory.instance( {
          path: this.listPath,
          data: data
        } ).query().then( function success( response ) {
          thisRef.cache = thisRef.cache.concat( response.data );
          thisRef.total = response.headers( 'Total' );
        } ).finally( function done() {
          thisRef.loading = false;
        } );
      },

    };

    return {
      instance: function( params ) { return new object( undefined === params ? {} : params ); },
      prototype: object.prototype
    };
  }
] );

/* ######################################################################################################## */
// TODO: replace with "apply" model as in base singleton factory? (no params processed here)
cenozo.factory( 'CnBaseViewFactory', [
  'CnHttpFactory',
  function( CnHttpFactory ) {
    var object = function( params ) {
      if( undefined === params.parentModel ) throw 'Tried to create CnBaseViewFactory without a parent model';
      if( undefined === params.subject ) throw 'Tried to create CnBaseViewFactory without a subject';
      if( undefined === params.name ) throw 'Tried to create CnBaseViewFactory without a name';
      if( undefined === params.inputList ) throw 'Tried to create CnBaseViewFactory without an input list';

      this.subject = null;
      this.name = {
        singular: '(undefined)',
        plural: '(undefined)',
        possessive: '(undefined)',
        pluralPossessive: '(undefined)'
      };
      this.inputList = [];
      this.record = {};

      cnCopyParams( this, params );
    };

    object.prototype = {
      load: function() {
        // set up the select and join list based on the column list
        this.record = {};
        var selectList = [];
        var joinList = [];
        for( var key in this.inputList ) {
          var lastJoin = null;
          var parentTable = this.subject;
          var columnParts = undefined === this.inputList[key].column
                          ? [ key ]
                          : this.inputList[key].column.split( '.' );
          for( var k = 0; k < columnParts.length; k++ ) {
            if( k == columnParts.length - 1 ) {
              // add this column to the select list
              var select = { column: columnParts[k], alias: key };
              if( 0 < k ) select.table = columnParts[k-1];
              else select.table_prefix = false;
              selectList.push( select );
            } else { // part of table list
              var table = columnParts[k];

              // don't join a table to itself
              if( table !== parentTable ) {
                var onleft = parentTable + '.' + table + '_id';
                var onright = table + '.id';

                // see if the join to this table already exists
                var join = null;
                for( var j = 0; j < joinList.length; j++ ) {
                  if( joinList[j].table == table &&
                      joinList[j].onleft == onleft &&
                      joinList[j].onright == onright ) {
                    join = joinList[j];
                    break;
                  }
                }

                // if the join wasn't found then add it to the list
                if( null === join ) {
                  join = { table: table, onleft: onleft, onright: onright };
                  joinList.push( join );
                }

                var lastJoin = join;
                var parentTable = table;
              }
            }
          }
        }

        var data = {};
        if( 0 < selectList.length ) data.select = { column: selectList };
        if( 0 < joinList.length ) data.modifier = { join: joinList };

        var thisRef = this;
        return CnHttpFactory.instance( {
          path: thisRef.parentModel.getViewPath(),
          data: data
        } ).get().then( function success( response ) {
          thisRef.record = response.data;

          // once the metadata is complete convert blank enums to empty strings (for ng-options)
          thisRef.parentModel.promise.then( function() {
            for( var column in thisRef.inputList ) {
              var metadata = thisRef.parentModel.metadata.columnList[column];
              var notRequired =
                ( undefined !== metadata && !metadata.required ) ||
                undefined === thisRef.inputList[column].required ||
                !thisRef.inputList[column].required;
              if( notRequired && 'enum' == thisRef.inputList[column].type ) {
                if( null === thisRef.record[column] ) {
                  thisRef.record[column] = '';
                }
              }
            }
          } );
        } );
      },
      patch: function( id, data ) {
        cnConvertToDatabaseRecord( data );
        var thisRef = this;
        return CnHttpFactory.instance( {
          path: this.subject + '/' + id,
          data: data
        } ).patch().then( function success() {
          if( undefined !== thisRef.parentModel.cnList ) {
            // find and update this record in the list
            var record = thisRef.parentModel.cnList.cache.find( // by id
              function( item, index, array ) { return id == item.id; }
            );
            if( undefined !== record ) for( var key in data ) record[key] = data[key];
          }
        } );
      }
    };

    return {
      instance: function( params ) { return new object( undefined === params ? {} : params ); },
      prototype: object.prototype
    };
  }
] );

/* ######################################################################################################## */
cenozo.factory( 'CnBaseModelFactory', [
  '$state', '$stateParams', 'CnHttpFactory',
  function( $state, $stateParams, CnHttpFactory ) {
    return {
      apply: function( object ) {
        if( undefined === object ) throw 'Tried to apply CnBaseModelFactory without a base object';
        if( undefined === object.subject ) throw 'Tried to apply CnBaseModelFactory without a subject';

        // define helper functions based on the state
        object.transitionToLastState = function() {
          var stateName = $state.current.name;
          if( 'view' == stateName.substring( stateName.lastIndexOf( '.' ) + 1 ) ) {
            $state.go( '^.list' );
          } else { // sub-view, return to parent view
            $state.go( '^.view', { id: $stateParams.parentId } );
          }
        };
        object.transitionToAddState = function() {
          var stateName = $state.current.name;
          if( 'view' == stateName.substring( stateName.lastIndexOf( '.' ) + 1 ) ) {
            $state.go( '^.add_' + this.subject, { parentId: $stateParams.id } );
          } else { // adding to a view state
            $state.go( '^.add' );
          }
        };
        object.transitionToViewState = function( id ) {
          var stateName = $state.current.name;
          if( 'view' == stateName.substring( stateName.lastIndexOf( '.' ) + 1 ) ) {
            $state.go( '^.view_' + this.subject, { parentId: $stateParams.id, id: id } );
          } else {
            $state.go( this.subject + '.view', { id: id } );
          }
        };
        object.getViewPath = function() {
          var path = undefined !== $stateParams.parentId
                   ? $state.current.name.split( '.' )[0] + '/' + $stateParams.parentId + '/'
                   : '';
          return path + this.subject + '/' + $stateParams.id;
        };

        // get metadata
        object.metadata = { columnList: {}, isLoading: true, isComplete: false };
        object.promise = CnHttpFactory.instance( {
          path: object.subject
        } ).head().then( function( response ) {
          var columnList = JSON.parse( response.headers( 'Columns' ) );
          for( var column in columnList ) {
            // parse out the enum values
            columnList[column].required = "1" == columnList[column].required;
            if( 'enum' == columnList[column].data_type ) {
              columnList[column].enumList = [];
              var enumList = columnList[column].type.replace( /^enum\(['"]/i, '' )
                                                  .replace( /['"]\)$/, '' )
                                                  .split( "','" );
              for( var i = 0; i < enumList.length; i++ ) {
                columnList[column].enumList.push( {
                  value: enumList[i],
                  name: enumList[i]
                } );
              }
            }
          }
          object.metadata.columnList = columnList;
        } );
      }
    };
  }
] );

/* ######################################################################################################## */
cenozo.factory( 'CnHttpFactory', [
  '$http',
  function CnHttpFactory( $http ) {
    var object = function( params ) {
      if( undefined === params.path ) throw 'Tried to create CnHttpFactory without a path';
      this.path = null;
      this.data = {};
      cnCopyParams( this, params );
    };

    object.prototype = {
      http: function( method, url ) {
        var object = { url: url, method: method };
        if( null != this.data ) {
          if( 'POST' == method || 'PATCH' == method ) object.data = this.data;
          else object.params = this.data;
        }
        return $http( object );
      },

      delete: function() { return this.http( 'DELETE', 'api/' + this.path ); },
      get: function() { return this.http( 'GET', 'api/' + this.path ); },
      head: function() { return this.http( 'HEAD', 'api/' + this.path ); },
      patch: function() { return this.http( 'PATCH', 'api/' + this.path ); },
      post: function() { return this.http( 'POST', 'api/' + this.path ); },
      query: function() { return this.http( 'GET', 'api/' + this.path ); }
    };
    
    return { instance: function( params ) { return new object( undefined === params ? {} : params ); } };
  }
] );

/* ######################################################################################################## */
cenozo.service( 'CnModalConfirmFactory', [
  '$modal',
  function( $modal ) {
    var object = function( params ) {
      this.title = 'Title';
      this.message = 'Message';
      cnCopyParams( this, params );
    };

    object.prototype = {
      show: function() {
        var thisRef = this;
        return $modal.open( {
          backdrop: true,
          keyboard: true,
          modalFade: true,
          templateUrl: cnCenozoUrl + '/app/cenozo/modal-confirm.tpl.html',
          controller: function( $scope, $modalInstance ) {
            $scope.local = thisRef;
            $scope.local.yes = function() { $modalInstance.close( true ); };
            $scope.local.no = function() { $modalInstance.close( false ); };
          }
        } ).result;
      }
    };

    return { instance: function( params ) { return new object( undefined === params ? {} : params ); } };
  }
] );

/* ######################################################################################################## */
cenozo.service( 'CnModalMessageFactory', [
  '$modal',
  function( $modal ) {
    var object = function( params ) {
      this.title = 'Title';
      this.message = 'Message';
      cnCopyParams( this, params );
    };

    object.prototype = {
      show: function() {
        var thisRef = this;
        return $modal.open( {
          backdrop: true,
          keyboard: true,
          modalFade: true,
          templateUrl: cnCenozoUrl + '/app/cenozo/modal-message.tpl.html',
          controller: function( $scope, $modalInstance ) {
            $scope.local = thisRef;
            $scope.local.close = function() { $modalInstance.dismiss(); };
          }
        } );
      }
    };

    return { instance: function( params ) { return new object( undefined === params ? {} : params ); } };
  }
] );

/* ######################################################################################################## */
cenozo.service( 'CnModalRestrictFactory', [
  '$modal',
  function( $modal ) {
    var object = function( params ) {
      if( undefined === params.column ) throw 'Tried to create CnModalRestrictFactory without a column';
      this.name = null;
      this.column = null;
      this.comparison = null;
      cnCopyParams( this, params );

      if( undefined === this.comparison || null === this.comparison ) this.comparison = { test: '<=>' };
      this.preExisting = undefined !== this.comparison.value;
    };

    object.prototype = {
      show: function() {
        var thisRef = this;
        return $modal.open( {
          backdrop: true,
          keyboard: true,
          modalFade: true,
          templateUrl: cnCenozoUrl + '/app/cenozo/modal-restrict.tpl.html',
          controller: function( $scope, $modalInstance ) {
            $scope.local = thisRef;
            $scope.local.ok = function( comparison ) { $modalInstance.close( comparison ); };
            $scope.local.remove = function() { $modalInstance.close( null ); };
            $scope.local.cancel = function() { $modalInstance.dismiss( 'cancel' ); };
          }
        } ).result;
      }
    };

    return { instance: function( params ) { return new object( undefined === params ? {} : params ); } };
  }
] );

/* ######################################################################################################## */
cenozo.service( 'CnModalTimezoneCalculatorFactory', [
  '$modal',
  function( $modal ) {
    var object = function( params ) {
      cnCopyParams( this, params );
    };

    object.prototype = {
      show: function() {
        var thisRef = this;
        return $modal.open( {
          backdrop: 'static',
          keyboard: true,
          modalFade: false,
          templateUrl: cnCenozoUrl + '/app/cenozo/modal-timezone-calculator.tpl.html',
          controller: function( $scope, $modalInstance ) {
            $scope.local = thisRef;
            $scope.local.close = function() { $modalInstance.close(); };
          }
        } );
      }
    };

    return { instance: function( params ) { return new object( undefined === params ? {} : params ); } };
  }
] );

/* ######################################################################################################## */
cenozo.service( 'CnModalValueFactory', [
  '$modal',
  function( $modal ) {
    var object = function( params ) {
      this.title = 'Title';
      this.message = 'Message';
      cnCopyParams( this, params );
    };

    object.prototype = {
      show: function() {
        var thisRef = this;
        return $modal.open( {
          backdrop: true,
          keyboard: true,
          modalFade: true,
          templateUrl: cnCenozoUrl + '/app/cenozo/modal-value.tpl.html',
          controller: function( $scope, $modalInstance ) {
            $scope.local = thisRef;
            $scope.local.ok = function( value ) { $modalInstance.close( value ); };
            $scope.local.cancel = function() { $modalInstance.dismiss( 'cancel' ); };
          }
        } );
      }
    };

    return { instance: function( params ) { return new object( undefined === params ? {} : params ); } };
  }
] );

/* ######################################################################################################## */
cenozo.factory( 'CnPaginationFactory',
  function CnPaginationFactory() {
    var object = function( params ) {
      this.currentPage = 1;
      this.showPageLimit = 10;
      this.itemsPerPage = 10;
      this.changePage = function() {};
      cnCopyParams( this, params );
    };

    object.prototype = {
      getMaxIndex: function() {
        return this.currentPage * this.itemsPerPage - 1;
      }
    };
    
    return { instance: function( params ) { return new object( undefined === params ? {} : params ); } };
  }
);
