'use strict';

try { var cenozo = angular.module( 'cenozo' ); }
catch( err ) { var cenozo = angular.module( 'cenozo', [] ); }

/* ######################################################################################################## */
cenozo.factory( 'CnBaseAddFactory',
  function() {
    var object = function( params ) {
      if( undefined === params.subject ) throw "Tried to create CnBaseAddFactory without a subject";
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
      if( undefined === params.subject ) throw "Tried to create CnBaseListFactory without a subject";
      this.subject = null;
      this.columnList = {};
      this.total = 0;
      this.order = {};
      this.data = {};
      this.cache = [];
      this.cnPagination = CnPaginationFactory.instance();

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
          subject: this.subject,
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
          subject: this.subject
        } ).delete( id ).then( function success( response ) {
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

        // set up the restrictions
        var where = [];
        for( var key in this.columnList ) {
          if( undefined !== this.columnList[key].restrict && null !== this.columnList[key].restrict ) {
            var test = this.columnList[key].restrict.test;
            var value = this.columnList[key].restrict.value;
            if( 'like' == test || 'not like' == test ) value = '%' + value + '%';
            where.push( {
              column: key,
              operator: test,
              value: value
            } );
          }
        }
        if( 0 < where.length ) data.modifier.where = where;

        // set up the offset and sorting
        if( null !== this.order ) {
          data.modifier.order = {};
          data.modifier.order[this.order.column] = this.order.reverse;
        }

        data.modifier = JSON.stringify( data.modifier );

        var thisRef = this;
        return CnHttpFactory.instance( {
          subject: this.subject,
          data: data
        } ).query().then( function success( response ) {
          // change datetimes to Date object
          response.data.results.forEach( function( element, index, array ) {
            if( undefined !== array[index].datetime && null !== array[index].datetime )
              array[index].datetime = cnDatetimeToObject( array[index].datetime );
          } );

          if( replace ) thisRef.cache = [];
          thisRef.cache = thisRef.cache.concat( response.data.results );
          thisRef.total = response.data.total;
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
      if( undefined === params.subject ) throw "Tried to create CnBaseViewFactory without a subject";
      this.subject = null;
      this.record = {};
      cnCopyParams( this, params );
    };

    object.prototype = {
      load: function( id ) {
        var thisRef = this;
        CnHttpFactory.instance( {
          subject: this.subject
        } ).get( id ).then( function success( response ) {
          thisRef.record = response.data;
        } );
      },
      patch: function( id, data ) {
        // convert Date object to datetime string
        if( 'datetime' == data[0] ) data[0] = cnObjectToDatetime( data[0] );
        return CnHttpFactory.instance( {
          subject: this.subject,
          data: data
        } ).patch( id );
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
      if( undefined === params.subject ) throw "Tried to create CnBaseSingletonFactory without a subject";
      if( undefined === params.cnAdd ) throw "Tried to create CnBaseSingletonFactory without a cnAdd";
      if( undefined === params.cnList ) throw "Tried to create CnBaseSingletonFactory without a cnList";
      if( undefined === params.cnView ) throw "Tried to create CnBaseSingletonFactory without a cnView";

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
      if( undefined === params.subject ) throw "Tried to create CnHttpFactory without a subject";
      this.subject = null;
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
      post: function() { return this.http( 'POST', 'api/' + this.subject ); },
      metadata: function() { this.data.metadata = true; return this.query( this.subject ); },
      query: function() { return this.http( 'GET', 'api/' + this.subject ); },
      get: function( id ) { return this.http( 'GET', 'api/' + this.subject + '/' + id ); },
      patch: function( id ) { return this.http( 'PATCH', 'api/' + this.subject + '/' + id ); },
      delete: function( id ) { return this.http( 'DELETE', 'api/' + this.subject + '/' + id ); }
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
      if( undefined === params.column ) throw "Tried to create CnModalRestrictFactory without a column";
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
