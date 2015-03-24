'use strict';

try { var cenozo = angular.module( 'cenozo' ); }
catch( err ) { var cenozo = angular.module( 'cenozo', [] ); }

/* ######################################################################################################## */
cenozo.factory( 'CnBaseAddFactory',
  function() {
    var object = function( params ) {
      if( undefined === params.subject ) throw 'Tried to create CnBaseAddFactory without a subject';
      this.subject = null;
      cnCopyParams( this, params );
    };

    object.prototype = {};

    return {
      instance: function( params ) { return new object( undefined === params ? {} : params ); },
      prototype: object.prototype
    };
  }
);

/* ######################################################################################################## */
cenozo.factory( 'CnBaseListFactory', [
  'CnPaginationFactory', 'CnHttpFactory',
  function( CnPaginationFactory, CnHttpFactory ) {
    var object = function( params ) {
      if( undefined === params.subject ) throw 'Tried to create CnBaseListFactory without a subject';
      this.subject = null;
      this.columnList = {};
      this.total = 0;
      this.order = {};
      this.data = {};
      this.cache = [];
      this.cnPagination = CnPaginationFactory.instance();
      this.loading = false;

      var thisRef = this;
      cnCopyParams( this, params );
    };

    object.prototype = {
      add: function( record ) {
        var thisRef = this;
        // convert Date object to datetime string
        if( undefined !== record.datetime && null !== record.datetime )
          record.datetime = cnObjectToDatetime( record.datetime );
        return CnHttpFactory.instance( {
          path: this.subject,
          data: record
        } ).post().then( function success( response ) {
          record.id = response.data;
          thisRef.cache.unshift( record );
          thisRef.total++;
        } );
      },

      delete: function( id ) {
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
          this.load().catch( function exception() { cnFatalError(); } );
      },

      reload: function() {
        return this.load( this.data, true );
      },

      load: function( data, replace ) {
        if( undefined === data ) data = {};
        if( undefined === replace ) replace = false;
        this.data = JSON.parse( JSON.stringify( data ) ); // cache the data parameter

        data.modifier = {
          offset: replace ? 0 : this.cache.length
        };

        // set up the joins and restrictions
        var joinList = [];
        var whereList = [];
        for( var key in this.columnList ) {
          if( this.columnList[key].join ) {
            var lastJoin = null;
            var parentTable = this.subject;
            var columnParts = this.columnList[key].column.split( '.' );
            for( var k = 0; k < columnParts.length; k++ ) {
              if( k == columnParts.length - 1 ) {
                // add this column to the last join
                if( undefined === lastJoin.columns ) lastJoin.columns = [];
                lastJoin.columns.push( columnParts[k-1] + '.' + columnParts[k] + ' AS ' + key );
              } else { // part of table list
                var table = columnParts[k];
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
        if( 0 < joinList.length ) data.modifier.join = joinList;
        if( 0 < whereList.length ) data.modifier.where = whereList;

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
          path: this.subject,
          data: data
        } ).query().then( function success( response ) {
          // change datetimes to Date object
          response.data.results.forEach( function( element, index, array ) {
            for( var key in array[index] )
              if( 0 <= key.indexOf( 'date' ) && null !== array[index][key] )
                array[index][key] = cnDatetimeToObject( array[index][key] );
          } );

          if( replace ) thisRef.cache = [];
          thisRef.cache = thisRef.cache.concat( response.data.results );
          thisRef.total = response.data.total;
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
cenozo.factory( 'CnBaseViewFactory', [
  'CnHttpFactory',
  function( CnHttpFactory ) {
    var object = function( params ) {
      if( undefined === params.subject ) throw 'Tried to create CnBaseViewFactory without a subject';
      this.subject = null;
      this.record = {};
      cnCopyParams( this, params );
    };

    object.prototype = {
      load: function( id ) {
        var thisRef = this;
        CnHttpFactory.instance( {
          path: this.subject + '/' + id
        } ).get().then( function success( response ) {
          thisRef.record = response.data;
        } );
      },
      patch: function( id, data ) {
        // convert Date object to datetime string
        if( 'datetime' == data[0] ) data[0] = cnObjectToDatetime( data[0] );
        return CnHttpFactory.instance( {
          path: this.subject + '/' + id,
          data: data
        } ).patch();
      }
    };

    return {
      instance: function( params ) { return new object( undefined === params ? {} : params ); },
      prototype: object.prototype
    };
  }
] );

/* ######################################################################################################## */
cenozo.factory( 'CnBaseSingletonFactory',
  function() {
    var object = function( params ) {
      if( undefined === params.subject ) throw 'Tried to create CnBaseSingletonFactory without a subject';

      this.subject = {
        singular: '(undefined)',
        plural: '(undefined)',
        possessive: '(undefined)',
        pluralPossessive: '(undefined)'
      };

      cnCopyParams( this, params );
    };

    object.prototype = {
      view: function( id ) {
        for( var i = 0; i < this.cnList.cache.length; i++ ) {
          if( this.cnList.cache[i].id == id ) {
            this.cnView.record = this.cnList.cache[i];
            return true;
          }
        }
        return false;
      }
    };

    return {
      instance: function( params ) { return new object( undefined === params ? {} : params ); },
      prototype: object.prototype
    };
  }
);

/* ######################################################################################################## */
cenozo.factory( 'CnHttpFactory', [
  '$http',
  function CnHttpFactory( $http ) {
    var object = function( params ) {
      if( undefined === params.path ) throw 'Tried to create CnHttpFactory without a path';
      this.path = null;
      this.data = {};
      cnCopyParams( this, params );
    }

    object.prototype = {
      http: function( method, url ) {
        var object = { url: url, method: method };
        if( null != this.data ) {
          if( 'POST' == method || 'PATCH' == method ) object.data = this.data;
          else object.params = this.data;
        }
        return $http( object );
      },
      post: function() { return this.http( 'POST', 'api/' + this.path ); },
      metadata: function() { this.data.metadata = true; return this.query( this.path ); },
      query: function() { return this.http( 'GET', 'api/' + this.path ); },
      get: function() { return this.http( 'GET', 'api/' + this.path ); },
      patch: function() { return this.http( 'PATCH', 'api/' + this.path ); },
      delete: function() { return this.http( 'DELETE', 'api/' + this.path ); }
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
            $scope.thisRef = thisRef;
            $scope.thisRef.yes = function() { $modalInstance.close( true ); };
            $scope.thisRef.no = function() { $modalInstance.close( false ); };
          }
        } );
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
            $scope.thisRef = thisRef;
            $scope.thisRef.close = function() { $modalInstance.dismiss(); };
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
      this.subject = null;
      this.column = null;
      this.comparison = { test: '<=>' };
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
cenozo.factory( 'CnStateSingleton', [
  'CnHttpFactory',
  function( CnHttpFactory ) {
    var object = function() {
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

        // chain a second http request into the promise
        return CnHttpFactory.instance( {
          path: 'access'
        } ).query().then( function success( response ) {
          for( var i = 0; i < response.data.results.length; i++ ) {
            var access = response.data.results[i];

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
        } );
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
    };
    
    return new object();
  }
] );
