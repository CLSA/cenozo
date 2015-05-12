'use strict';

try { var cenozo = angular.module( 'cenozo' ); }
catch( err ) { var cenozo = angular.module( 'cenozo', [] ); }

/* ######################################################################################################## */
cenozo.factory( 'CnAppSingleton', [
  '$state', 'CnHttpFactory',
  function( $state, CnHttpFactory ) {
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
      } ).catch( function exception() { $state.go( 'error.500' ); } );

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
cenozo.factory( 'CnBaseAddFactory', [
  'CnHttpFactory',
  function( CnHttpFactory ) {
    return {
      construct: function( object, parentModel ) {
        object.parentModel = parentModel;

        /**
         * Must be called by the onAdd() function in order to send the new record to the server.
         * This function should not be changed, override the onAdd() function instead.
         * 
         * @param object record: The record to add
         * @return promise
         */
        object.addRecord = function( record ) {
          if( !this.parentModel.addEnabled ) throw 'Calling addRecord() but addEnabled is false';
          cnConvertToDatabaseRecord( record );
          return CnHttpFactory.instance( {
            path: this.parentModel.getServiceCollectionPath(),
            data: record
          } ).post();
        };

        /**
         * Must be called by the onNew() function in order to create a new local record.
         * This function should not be changed, override the onNew() function instead.
         * 
         * @param object record: The object to initialize as a new record
         * @return promise
         */
        object.newRecord = function( record ) {
          if( !this.parentModel.addEnabled ) throw 'Calling newRecord() but addEnabled is false';

          // load the metadata and use it to apply default values to the record
          var thisRef = this;
          this.parentModel.metadata.loadingCount++;
          return this.parentModel.getMetadata().then( function() {
            // apply default values from the metadata
            for( var column in thisRef.parentModel.metadata.columnList )
              if( null !== thisRef.parentModel.metadata.columnList[column].default )
                record[column] = 'tinyint' == thisRef.parentModel.metadata.columnList[column].data_type
                               ? 1 == thisRef.parentModel.metadata.columnList[column].default
                               : thisRef.parentModel.metadata.columnList[column].default;

            // get rank information, if needed, and set the default value to the highest rank
            var promise = null;
            if( undefined !== thisRef.parentModel.inputList.rank ) {
              thisRef.parentModel.metadata.loadingCount++;
              CnHttpFactory.instance( {
                path: thisRef.parentModel.getServiceCollectionPath(),
                data: { select: { column: { column: 'MAX(rank)', alias: 'max', table_prefix: false } } }
              } ).query().then( function success( response ) {
                if( 0 < response.data.length ) {
                  var max = parseInt( response.data[0].max );
                  thisRef.parentModel.metadata.columnList.rank.enumList = [];
                  for( var rank = 1; rank <= max + 1; rank++ )
                    thisRef.parentModel.metadata.columnList.rank.enumList.push( { value: rank, name: rank } );
                  record.rank = thisRef.parentModel.metadata.columnList.rank.default = max + 1;
                }
                // signal that we are done loading metadata
                thisRef.parentModel.metadata.loadingCount--;
              } );
            }

            // signal that we are done loading metadata
            thisRef.parentModel.metadata.loadingCount--;
          } );
        };

        /**
         * Override this function when needing to make additional operations when adding or creating
         * this model's records.
         * 
         * @return promise
         */
        object.onAdd = function( record ) { return this.addRecord( record ); };
        object.onNew = function( record ) { return this.newRecord( record ); };
      }
    };
  }
] );

/* ######################################################################################################## */
cenozo.factory( 'CnBaseListFactory', [
  'CnPaginationFactory', 'CnHttpFactory',
  function( CnPaginationFactory, CnHttpFactory ) {
    return {
      construct: function( object, parentModel ) {
        object.parentModel = parentModel;
        object.order = object.parentModel.defaultOrder;
        object.total = 0;
        object.cache = [];
        object.cnPagination = CnPaginationFactory.instance();
        object.isLoading = false;

        object.orderBy = function( column ) {
          if( null === this.order || column != this.order.column ) {
            this.order = { column: column, reverse: false };
          } else {
            this.order.reverse = !this.order.reverse;
          }
          if( this.cache.length < this.total ) this.listRecords( true );
          this.cnPagination.currentPage = 1;
        };

        object.restrict = function( column, restrict ) {
          var columnList = this.parentModel.columnList;
          if( undefined === restrict ) {
            if( undefined !== columnList[column].restrict ) delete columnList[column].restrict;
          } else {
            columnList[column].restrict = restrict;
          }
          this.listRecords( true );
          this.cnPagination.currentPage = 1;
        };

        object.checkCache = function() {
          var thisRef = this;
          if( this.cache.length < this.total && this.cnPagination.getMaxIndex() >= this.cache.length )
            this.listRecords().catch( function exception( response ) {
              thisRef.parentModel.transitionToErrorState( response );
            } );
        };

        /**
         * Must be called by the onChoose() function in order to add a record on the server in a
         * many-to-many relationship.
         * This function should not be changed, override the onChoose() function instead.
         * 
         * @param object record: The record to choose
         * @return promise
         */
        object.chooseRecord = function( record ) {
          if( !this.parentModel.chooseEnabled ) throw 'Calling chooseRecord() but chooseEnabled is false';

          return record.chosen ?
            CnHttpFactory.instance( {
              path: this.parentModel.getServiceResourcePath( record.id )
            } ).delete().then( function success( response ) { record.chosen = 0; } ) :
            CnHttpFactory.instance( {
              path: this.parentModel.getServiceCollectionPath(), data: record.id
            } ).post().then( function success( response ) { record.chosen = 1; } );
        };

        /**
         * Must be called by the onDelete() function in order to delete a record from the server.
         * This function should not be changed, override the onDelete() function instead.
         * 
         * @param int id: The id of the record to delete
         * @return promise
         */
        object.deleteRecord = function( id ) {
          if( !this.parentModel.deleteEnabled ) throw 'Calling deleteRecord() but deleteEnabled is false';

          var thisRef = this;
          return CnHttpFactory.instance( {
            path: this.parentModel.getServiceResourcePath( id ),
          } ).delete().then( function success( response ) {
            for( var i = 0; i < thisRef.cache.length; i++ ) {
              if( thisRef.cache[i].id == id ) {
                thisRef.total--;
                return thisRef.cache.splice( i, 1 );
              }
            }
          } );
        };

        /**
         * Must be called by the onList() function in order to load records from the server.
         * This function should not be changed, override the onList() function instead.
         * 
         * @param boolean replace: Whether to replace the cached list or append to it
         * @return promise
         */
        object.listRecords = function( replace ) {
          if( undefined === replace ) replace = false;
          if( replace ) this.cache = [];

          var data = getServiceData( this.parentModel.subject, this.parentModel.columnList );
          if( undefined === data.modifier ) data.modifier = {};
          data.modifier.offset = replace ? 0 : this.cache.length;
          if( parentModel.chooseEnabled && this.chooseMode ) data.choosing = 1;

          // set up the offset and sorting
          if( null !== this.order ) {
            // add the table prefix to the column if there isn't already a prefix
            var column = this.order.column;
            data.modifier.order = {};
            data.modifier.order[column] = this.order.reverse;
          }

          this.isLoading = true;
          var thisRef = this;
          return CnHttpFactory.instance( {
            path: this.parentModel.getServiceCollectionPath(),
            data: data
          } ).query().then( function success( response ) {
            thisRef.cache = thisRef.cache.concat( response.data );
            thisRef.total = response.headers( 'Total' );
          } ).then( function done() {
            thisRef.isLoading = false;
          } );
        };

        object.chooseMode = false;
        object.toggleChooseMode = function() {
          this.chooseMode = !this.chooseMode;
          this.listRecords( true );
        };

        /**
         * Override these function when needing to make additional operations when choosing, deleting
         * or listing this model's records.
         * 
         * @return promise
         */
        object.onChoose = function( record ) { return this.chooseRecord( record ); };
        object.onDelete = function( id ) { return this.deleteRecord( id ); };
        object.onList = function( replace ) { return this.listRecords( replace ); };
      }
    };
  }
] );

/* ######################################################################################################## */
cenozo.factory( 'CnBaseViewFactory', [
  'CnHttpFactory',
  function( CnHttpFactory ) {
    return {
      construct: function( object, parentModel ) {
        object.parentModel = parentModel;
        object.record = {};

        /**
         * Must be called by the onDelete() function in order to delete the viewed record from the server.
         * This function should not be changed, override the onDelete() function instead.
         * 
         * @return promise
         */
        object.deleteRecord = function() {
          return CnHttpFactory.instance( {
            path: this.parentModel.getServiceResourcePath()
          } ).delete();
        };

        /**
         * Must be called by the onPatch() function in order to make changes on the server to the viewed record.
         * This function should not be changed, override the onPatch() function instead.
         * 
         * @param object data: An object of column -> value pairs to change
         * @return promise
         */
        object.patchRecord = function( data ) {
          cnConvertToDatabaseRecord( data );
          return CnHttpFactory.instance( {
            path: this.parentModel.getServiceResourcePath(),
            data: data
          } ).patch();
        };

        /**
         * Must be called by the onView() function in order to load data from the server to view the record.
         * This function should not be changed, override the onView() function instead.
         * 
         * @return promise
         */
        object.viewRecord = function() {
          if( !this.parentModel.viewEnabled ) throw 'Calling viewRecord() but viewEnabled is false';

          this.record = {};
          var thisRef = this;
          return CnHttpFactory.instance( {
            path: this.parentModel.getServiceResourcePath(),
            data: getServiceData( this.parentModel.subject, this.parentModel.inputList )
          } ).get().then( function success( response ) {
            thisRef.record = response.data;
            thisRef.parentModel.metadata.loadingCount++;

            return thisRef.parentModel.getMetadata().then( function() {
              // convert blank enums into empty strings (for ng-options)
              for( var column in thisRef.parentModel.inputList ) {
                var inputObject = thisRef.parentModel.inputList[column];
                var metadata = thisRef.parentModel.metadata.columnList[column];
                var notRequired =
                  ( undefined !== metadata && !metadata.required ) ||
                  undefined === inputObject.required ||
                  !inputObject.required;
                if( notRequired && 'enum' == inputObject.type && null === thisRef.record[column] )
                  thisRef.record[column] = '';
              }

              // get rank information, if needed
              var promise = null;
              if( undefined !== thisRef.parentModel.inputList.rank ) {
                thisRef.parentModel.metadata.loadingCount++;
                CnHttpFactory.instance( {
                  path: thisRef.parentModel.getServiceCollectionPath(),
                  data: { select: { column: { column: 'MAX(rank)', alias: 'max', table_prefix: false } } }
                } ).query().then( function success( response ) {
                  if( 0 < response.data.length ) {
                    thisRef.parentModel.metadata.columnList.rank.enumList = [];
                    for( var rank = 1; rank <= parseInt( response.data[0].max ); rank++ )
                      thisRef.parentModel.metadata.columnList.rank.enumList.push( { value: rank, name: rank } );
                  }
                  // signal that we are done loading metadata
                  thisRef.parentModel.metadata.loadingCount--;
                } );
              }

              // signal that we are done loading metadata
              thisRef.parentModel.metadata.loadingCount--;
            } );
          } );
        };

        /**
         * Override these function when needing to make additional operations when deleting, patching
         * or viewing this model's records.
         * 
         * @return promise
         */
        object.onDelete = function() { return this.deleteRecord(); };
        object.onPatch = function( data ) { return this.patchRecord( data ); };
        object.onView = function() { return this.viewRecord(); };
      }
    };
  }
] );

/* ######################################################################################################## */
cenozo.factory( 'CnBaseModelFactory', [
  '$state', '$stateParams', 'CnHttpFactory',
  function( $state, $stateParams, CnHttpFactory ) {
    return {
      construct: function( object, module ) {
        for( var property in module ) object[property] = cnCopy( module[property] );

        object.metadata = { loadingCount: 0 };
        object.addEnabled = false;
        object.chooseEnabled = false;
        object.deleteEnabled = false;
        object.viewEnabled = false;

        object.getId = function() {
          if( undefined === $stateParams.id ) throw 'Unable to determine id';
          return $stateParams.id;
        };
        
        object.getParentIdentifier = function() {
          var stateNameParts = $state.current.name.split( '.' );
          var len = stateNameParts.length;
          if( 2 > len ) throw 'State "' + $state.current.name + '" is expected to have at least 2 parts';

          var parentIdentifier = {};
          if( stateNameParts[len-2] != this.subject ) {
            var parentSubject = stateNameParts[len-2];
            var parentId = undefined !== $stateParams.parentId ? $stateParams.parentId : $stateParams.id;
            parentIdentifier[parentSubject] = parentId;
          }
          return parentIdentifier;
        };
        
        // Helper functions to get service paths
        object.getServiceCollectionPath = function() {
          var path = '';
          var parentIdentifier = this.getParentIdentifier();
          for( var property in parentIdentifier ) path += property + '/' + parentIdentifier[property] + '/';
          return path + module.subject;
        }
        object.getServiceResourcePath = function( resource ) {
          var id = undefined === resource ? $stateParams.id : resource;
          return this.getServiceCollectionPath() + '/' + id;
        }

        // helper functions based on the state
        object.transitionToLastState = function() {
          var stateName = $state.current.name;
          var action = stateName.substring( stateName.lastIndexOf( '.' ) + 1 );
          if( 'add' == action || 'view' == action ) {
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
        object.transitionToErrorState = function( response ) {
          var type = undefined === response || undefined === response.status || 404 != response.status
                   ? '500' : '404';
          $state.go( 'error.' + type );
        };

        /**
         * Makes an array containing COPIES of the model's input list
         */
        object.getInputArray = function( removeInputList ) {
          if( undefined === removeInputList ) removeInputList = [];

          // make a copy of the input list and remove any parent column(s)
          var inputObjectList = cnCopy( this.inputList );
          for( var property in this.getParentIdentifier() ) delete inputObjectList[property+'_id'];

          // create an array out of the input list
          var inputArray = [];
          for( var key in inputObjectList ) {
            if( 0 > removeInputList.indexOf( key ) ) {
              var input = inputObjectList[key];
              input.key = key;
              inputArray.push( input );
            }
          }
          return inputArray;
        };

        /**
         * Makes an array containing REFERENCES to the model's column list
         */
        object.getColumnArray = function( removeColumnList ) {
          if( undefined === removeColumnList ) removeColumnList = [];

          // create an array out of the column list
          var columnArray = [];
          for( var key in this.columnList ) {
            if( 0 > removeColumnList.indexOf( key ) ) {
              var column = this.columnList[key];
              if( undefined === column.allowRestrict ) column.allowRestrict = true;
              column.key = key;
              columnArray.push( column );
            }
          }
          return columnArray;
        };

        // enable/disable module functionality
        object.enableAdd = function( enable ) { this.addEnabled = enable; };
        object.enableChoose = function( enable ) { this.chooseEnabled = enable; };
        object.enableDelete = function( enable ) { this.deleteEnabled = enable; };
        object.enableView = function( enable ) { this.viewEnabled = enable; };

        /**
         * Must be called by the getMetadata() function in order to load this model's base metadata
         * This function should not be changed, override the getMetadata() function instead.
         * 
         * @return promise
         */
        object.loadMetadata = function() {
          this.metadata.columnList = {};
          this.metadata.isComplete = false;
          this.metadata.loadingCount++;
          var thisRef = this;
          return CnHttpFactory.instance( {
            path: this.subject
          } ).head().then( function( response ) {
            var columnList = JSON.parse( response.headers( 'Columns' ) );
            for( var column in columnList ) {
              // parse out the enum values
              columnList[column].required = '1' == columnList[column].required;
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
            thisRef.metadata.columnList = columnList;
            thisRef.metadata.loadingCount--;
          } );
        };

        /**
         * Override this function when additional metadata is required by the model.
         * 
         * @return promise
         */
        object.getMetadata = function() { return this.loadMetadata(); };
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

      this.http = function( method, url ) {
        var object = { url: url, method: method };
        if( null != this.data ) {
          if( 'POST' == method || 'PATCH' == method ) object.data = this.data;
          else object.params = this.data;
        }
        return $http( object );
      };

      this.delete = function() { return this.http( 'DELETE', 'api/' + this.path ); };
      this.get = function() { return this.http( 'GET', 'api/' + this.path ); };
      this.head = function() { return this.http( 'HEAD', 'api/' + this.path ); };
      this.patch = function() { return this.http( 'PATCH', 'api/' + this.path ); };
      this.post = function() { return this.http( 'POST', 'api/' + this.path ); };
      this.query = function() { return this.http( 'GET', 'api/' + this.path ); };
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



/* ######################################################################################################## */
function getServiceData( subject, list ) {
  // set up the select, join and where list based on the column list
  var selectList = [];
  var joinList = [];
  var whereList = [];
  for( var key in list ) {
    var lastJoin = null;
    var parentTable = subject;
    var columnParts = undefined === list[key].column ? [ key ] : list[key].column.split( '.' );
    for( var k = 0; k < columnParts.length; k++ ) {
      if( k == columnParts.length - 1 ) {
        if( 'months' == list[key].type ) {
          selectList = selectList.concat( cnMonthList );
        } else {
          // add this column to the select list
          var select = { column: columnParts[k], alias: key };
          if( 0 < k ) select.table = columnParts[k-1];
          else select.table_prefix = false;
          selectList.push( select );
        }
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

    if( undefined !== list[key].restrict && null !== list[key].restrict ) {
      var test = list[key].restrict.test;
      var value = list[key].restrict.value;
      if( 'like' == test || 'not like' == test ) value = '%' + value + '%';
      
      // determine the column name
      var column = key;
      if( undefined !== list[key].column ) {
        var columnParts = list[key].column.split( '.' );
        var len = columnParts.length;
        column = list[key].column;
        if( 2 < len ) column = columnParts[len-2] + '.' + columnParts[len-1];
      }

      whereList.push( { 
        column: column,
        operator: test,
        value: value
      } );
    }
  }

  var data = {};
  if( 0 < selectList.length ) data.select = { column: selectList };
  if( 0 < joinList.length || 0 < whereList.length ) {
    data.modifier = {};
    if( 0 < joinList.length ) data.modifier.join = joinList;
    if( 0 < whereList.length ) data.modifier.where = whereList;
  }
  return data;
}
