'use strict';

try { var cenozo = angular.module( 'cenozo' ); }
catch( err ) { var cenozo = angular.module( 'cenozo', [] ); }

/* ######################################################################################################## */
cenozo.factory( 'CnBaseAddFactory',
  function() {
    var object = function( params ) {
      if( undefined === params.subject ) throw 'Tried to create CnBaseAddFactory without a subject';
      if( undefined === params.name ) throw 'Tried to create CnBaseAddFactory without a name';

      this.subject = null;
      this.name = {
        singular: '(undefined)',
        plural: '(undefined)',
        possessive: '(undefined)',
        pluralPossessive: '(undefined)'
      };
      this.createRecord = function() { return {}; };

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
      if( undefined === params.name ) throw 'Tried to create CnBaseListFactory without a name';

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

      var thisRef = this;
      cnCopyParams( this, params );
    };

    object.prototype = {
      enableAdd: function( enable ) {
        if( enable != this.addEnabled ) {
          this.addEnabled = enable;
          if( enable ) {
            this.add = function( record ) {
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
          } else {
            delete this.selectMode;
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
          this.load().catch( function exception() { cnFatalError(); } );
      },

      reload: function() {
        return this.load( this.listPath, true );
      },

      load: function( path, replace ) {
        if( undefined === replace ) replace = false;
        this.listPath = undefined === path || null === path ? this.subject : path;

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
          // change datetimes to Date object
          response.data.forEach( function( element, index, array ) {
            for( var key in array[index] ) {
              if( null !== array[index][key] ) {
                if( 0 <= key.regexIndexOf( /^date|[^a-z|\Wdate|_date]/ ) )
                  array[index][key] = cnDatetimeToObject( array[index][key] );
                else if( 0 <= key.regexIndexOf( /^rank|\Wrank|_rank/ ) ||
                         0 <= key.regexIndexOf( /^count|\Wcount|_count/ ) )
                  array[index][key] = parseInt( array[index][key] );
              }
            }
          } );

          if( replace ) thisRef.cache = [];
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
cenozo.factory( 'CnBaseViewFactory', [
  'CnHttpFactory',
  function( CnHttpFactory ) {
    var object = function( params ) {
      if( undefined === params.subject ) throw 'Tried to create CnBaseViewFactory without a subject';
      if( undefined === params.name ) throw 'Tried to create CnBaseViewFactory without a name';

      this.subject = null;
      this.name = {
        singular: '(undefined)',
        plural: '(undefined)',
        possessive: '(undefined)',
        pluralPossessive: '(undefined)'
      };
      this.record = {};

      cnCopyParams( this, params );
    };

    object.prototype = {
      load: function( id ) {
        var thisRef = this;
        return CnHttpFactory.instance( {
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
      if( undefined === params.name ) throw 'Tried to create CnBaseSingletonFactory without a name';

      this.subject = null;
      this.name = {
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
cenozo.factory( 'CnAppSingleton', [
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
          for( var i = 0; i < response.data.length; i++ ) {
            var access = response.data[i];

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
