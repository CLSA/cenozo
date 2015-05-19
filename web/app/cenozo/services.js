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
        thisRef.application = cnCopy( response.data.application );
        thisRef.user = cnCopy( response.data.user );
        thisRef.site = cnCopy( response.data.site );
        thisRef.role = cnCopy( response.data.role );
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

      this.formatDatetime = function formatDatetime( dtStr, type ) {
        if( 0 > ['datetimesecond','datetime','date','timesecond','time'].indexOf( type ) )
          throw 'Tried to format datetime for type "' + type + '" which is not supported';
        var formatted = dtStr;
        if( null !== dtStr ) {
          var obj = moment( dtStr );
          if( 'datetimesecond' == type || 'datetime' == type ) {
            obj.tz( this.site.timezone );
            if( 'datetimesecond' == type ) formatted = obj.format( 'YYYY-MM-DD HH:mm:ss' );
            else /*if( 'datetime' == type )*/ formatted = obj.format( 'YYYY-MM-DD HH:mm' );
          } else {
            if( 'date' == type ) formatted = obj.format( 'YYYY-MM-DD' );
            else if( 'timesecond' == type ) formatted = obj.format( 'HH:mm:ss' );
            else /*if( 'time' == type )*/ formatted = obj.format( 'HH:mm' );
          }
        }
        return formatted;
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
              path: this.parentModel.getServiceResourcePath( record.getIdentifier() )
            } ).delete().then( function success() { record.chosen = 0; } ) :
            CnHttpFactory.instance( {
              path: this.parentModel.getServiceCollectionPath(), data: record.getIdentifier()
            } ).post().then( function success() { record.chosen = 1; } );
        };

        /**
         * Must be called by the onDelete() function in order to delete a record from the server.
         * This function should not be changed, override the onDelete() function instead.
         * 
         * @param object record: The record to delete
         * @return promise
         */
        object.deleteRecord = function( record ) {
          if( !this.parentModel.deleteEnabled ) throw 'Calling deleteRecord() but deleteEnabled is false';

          var thisRef = this;
          return CnHttpFactory.instance( {
            path: this.parentModel.getServiceResourcePath( record.getIdentifier() ),
          } ).delete().then( function success() {
            for( var i = 0; i < thisRef.cache.length; i++ ) {
              if( thisRef.cache[i].getIdentifier() == record.getIdentifier() ) {
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
            // add the getIdentifier() method to each row before adding it to the cache
            for( var i = 0; i < response.data.length; i++ ) {
              response.data[i].getIdentifier = function() {
                return thisRef.parentModel.getIdentifierFromRecord( this );
              };
            }
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
        object.onDelete = function( record ) { return this.deleteRecord( record ); };
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
        object.rawRecord = {};
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

          //this.record = {};
          var thisRef = this;
          return CnHttpFactory.instance( {
            path: this.parentModel.getServiceResourcePath(),
            data: getServiceData( this.parentModel.subject, this.parentModel.inputList )
          } ).get().then( function success( response ) {
            thisRef.rawRecord = cnCopy( response.data );
            thisRef.record = cnCopy( response.data );
            thisRef.record.getIdentifier = function() {
              return thisRef.parentModel.getIdentifierFromRecord( this );
            };
            thisRef.parentModel.metadata.loadingCount++;

            return thisRef.parentModel.getMetadata().then( function() {
              // convert blank enums into empty strings (for ng-options)
              for( var column in thisRef.parentModel.inputList ) {
                var inputObject = thisRef.parentModel.inputList[column];
                if( 'enum' == inputObject.type && null === thisRef.record[column] ) {
                  var metadata = thisRef.parentModel.metadata.columnList[column];
                  if( undefined !== metadata && !metadata.required ) thisRef.record[column] = '';
                }
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

        // override this method to use a custom identifier
        object.getIdentifierFromRecord = function( record ) { return String( record.id ); };

        // returns an object containing a subject => identifier pair
        object.getParentIdentifierObject = function() {
          var stateNameParts = $state.current.name.split( '.' );
          var len = stateNameParts.length;
          if( 2 > len ) throw 'State "' + $state.current.name + '" is expected to have at least 2 parts';

          var identifierObject = {};
          if( stateNameParts[len-2] != this.subject ) {
            var parentSubject = stateNameParts[len-2];
            var parentIdentifier = undefined !== $stateParams.parentIdentifier
                                 ? $stateParams.parentIdentifier
                                 : $stateParams.identifier;
            identifierObject[parentSubject] = parentIdentifier;
          }

          return identifierObject;
        };

        object.getParentSubject = function() {
          var subjectList = Object.keys( this.getParentIdentifierObject() );
          return 0 < subjectList.length ? subjectList[0] : null;
        };

        // Helper functions to get service paths
        object.getServiceCollectionPath = function() {
          var path = '';
          var parentIdentifier = this.getParentIdentifierObject();
          for( var property in parentIdentifier ) path += property + '/' + parentIdentifier[property] + '/';
          return path + module.subject;
        }
        object.getServiceResourcePath = function( resource ) {
          var identifier = undefined === resource ? $stateParams.identifier : resource;
          return this.getServiceCollectionPath() + '/' + identifier;
        }

        // helper functions based on the state
        object.reloadState = function( record ) {
          if( undefined === record ) {
            $state.reload();
          } else {
            $stateParams.identifier = record.getIdentifier();
            $state.transitionTo( $state.current, $stateParams, { reload: true } );
          }
        };
        object.transitionToLastState = function() {
          var stateName = $state.current.name;
          var action = stateName.substring( stateName.lastIndexOf( '.' ) + 1 );
          if( 'add' == action || 'view' == action ) {
            $state.go( '^.list' );
          } else { // sub-view, return to parent view
            $state.go( '^.view', { identifier: $stateParams.parentIdentifier } );
          }
        };
        object.transitionToAddState = function() {
          var stateName = $state.current.name;
          if( 'view' == stateName.substring( stateName.lastIndexOf( '.' ) + 1 ) ) {
            $state.go( '^.add_' + this.subject, { parentIdentifier: $stateParams.identifier } );
          } else { // adding to a view state
            $state.go( '^.add' );
          }
        };
        object.transitionToViewState = function( record ) {
          var stateName = $state.current.name;
          if( 'view' == stateName.substring( stateName.lastIndexOf( '.' ) + 1 ) ) {
            $state.go( '^.view_' + this.subject, {
              parentIdentifier: $stateParams.identifier, identifier: record.getIdentifier()
            } );
          } else {
            $state.go( this.subject + '.view', { identifier: record.getIdentifier() } );
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
          for( var property in this.getParentIdentifierObject() ) delete inputObjectList[property+'_id'];

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
              columnList[column].required = '1' == columnList[column].required;
              if( 'enum' == columnList[column].data_type ) { // parse out the enum values
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

            if( undefined !== thisRef.metadata.columnList.rank ) { // create enum for rank columns
              thisRef.metadata.loadingCount++;
              CnHttpFactory.instance( {
                path: thisRef.getServiceCollectionPath(),
                data: { select: { column: { column: 'MAX(rank)', alias: 'max', table_prefix: false } } }
              } ).query().then( function success( response ) {
                if( 0 < response.data.length ) {
                  thisRef.metadata.columnList.rank.enumList = [];
                  if( null !== response.data[0].max )
                    for( var rank = 1; rank <= parseInt( response.data[0].max ); rank++ )
                      thisRef.metadata.columnList.rank.enumList.push( { value: rank, name: rank } );
                }
                // signal that we are done loading metadata
                thisRef.metadata.loadingCount--;
              } );
            }
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
cenozo.service( 'CnModalDatetimeFactory', [
  '$modal', 'CnAppSingleton',
  function( $modal, CnAppSingleton ) {
    var object = function( params ) {
      var viewMoveGaps = {
        day: { unit: 'months', amount: 1 },
        month: { unit: 'years', amount: 1 },
        year: { unit: 'years', amount: 20 },
      };

      function split( array, size ) {
        var subArrays = [];
        while( 0 < array.length ) subArrays.push( array.splice( 0, size ) );
        return subArrays;
      }

      function addDate( list, date, currentDate, viewingDate, front ) {
        var object = {
          date: date,
          label: date.format( 'DD' ),
          current: null !== currentDate &&
                   currentDate.isSame( date, 'year' ) &&
                   currentDate.isSame( date, 'month' ) &&
                   currentDate.isSame( date, 'day' ),
          offMonth: !viewingDate.isSame( date, 'month' ),
          weekend: 0 <= [0,6].indexOf( date.day() ),
          disabled: false
        };
        if( true === front ) list.unshift( object );
        else list.push( object );
      }

      // service vars which can be defined by the contructor's params
      this.timezone = null;
      this.date = null;
      this.viewingDate = null;
      this.title = 'Title';
      this.pickerType = 'datetime';
      this.mode = 'day';
      cnCopyParams( this, params );

      // service vars which cannot be defined by the constructor's params
      if( null === this.timezone ) this.timezone = CnAppSingleton.site.timezone;
      if( null === this.date ) {
        this.viewingDate = moment();
      } else {
        this.date = moment( this.date );
        if( 'datetime' == this.pickerType || 'datetimesecond' == this.pickerType ) this.date.tz( this.timezone );
        this.viewingDate = moment( this.date );
      }
      this.modeTitle = '';
      this.displayTime = '';
      this.hourSliderValue = this.viewingDate.format( 'H' );
      this.minuteSliderValue = this.viewingDate.format( 'm' );
      this.secondSliderValue = this.viewingDate.format( 's' );

      this.nextMode = function() {
        this.mode = 'day' == this.mode ? 'month' : 'year';
        this.update();
      };
      this.viewPrev = function() {
        var gap = viewMoveGaps[this.mode];
        this.viewingDate.subtract( gap.amount, gap.unit );
        this.update();
      };
      this.viewNext = function() {
        var gap = viewMoveGaps[this.mode];
        this.viewingDate.add( gap.amount, gap.unit );
        this.update();
      };
      this.select = function( when ) {
        if( 'now' == when ) {
          this.date = moment();
        } else if( 'today' == when ) {
          this.date.year( moment().year() );
          this.date.month( moment().month() );
          this.date.date( moment().date() );
        } else {
          this.date = when;
        }

        if( null !== this.date ) this.viewingDate = moment( this.date );
        this.update();
      };
      this.updateDisplayTime = function() {
        var format = 'datetimesecond' == this.pickerType || 'timesecond' == this.pickerType
                   ? 'HH:mm:ss'
                   : 'HH:mm';
        this.displayTime = this.date.format( format ) + ' (' + this.timezone + ')';
      };
      this.update = function() {
        if( 'day' == this.mode ) {
          this.modeTitle = this.viewingDate.format( 'MMMM YYYY' );

          var cellList = [];

          // get forward dates
          var date = moment( this.viewingDate );
          for( ; date.month() == this.viewingDate.month() || 0 < date.day(); date.add( 1, 'days' ) )
            addDate( cellList, moment( date.format() ), this.date, this.viewingDate, false );

          // get backward dates
          var date = moment( this.viewingDate ).subtract( 1, 'days' );
          for( ; date.month() == this.viewingDate.month() || 6 > date.day(); date.subtract( 1, 'days' ) )
            addDate( cellList, moment( date.format() ), this.date, this.viewingDate, true );

          this.cellList = split( cellList, 7 );
        } else if( 'month' == this.mode ) {
          this.modeTitle = this.viewingDate.format( 'YYYY' );
        } else { // 'year' == this.mode
          var baseYear = Math.floor( this.viewingDate.format( 'YYYY' ) / 20 ) * 20;
          this.modeTitle = ( baseYear+1 ) + ' - ' + ( baseYear+20 );
        }

        this.updateDisplayTime();

        // need to send a resize event so the sliders update
        window.dispatchEvent( new Event( 'resize' ) );
      };

      this.update();
    };

    object.prototype = {
      show: function() {
        var thisRef = this;
        return $modal.open( {
          backdrop: true,
          keyboard: true,
          modalFade: true,
          templateUrl: cnCenozoUrl + '/app/cenozo/modal-datetime.tpl.html',
          controller: function( $scope, $modalInstance ) {
            $scope.local = thisRef;
            $scope.local.ok = function() {
              $modalInstance.close( null === $scope.local.date ? null : $scope.local.date.tz( 'utc' ).format() );
            };
            $scope.local.cancel = function() { $modalInstance.close( false ); };

            $scope.$watch( 'local.hourSliderValue', function( hour ) {
              $scope.local.date.hour( hour );
              $scope.local.updateDisplayTime();
            } );
            $scope.$watch( 'local.minuteSliderValue', function( minute ) {
              $scope.local.date.minute( minute );
              $scope.local.updateDisplayTime();
            } );
            $scope.$watch( 'local.secondSliderValue', function( second ) {
              $scope.local.date.second( second );
              $scope.local.updateDisplayTime();
            } );
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
      this.error = false;
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
