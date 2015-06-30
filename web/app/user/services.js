define( cenozo.getServicesIncludeList( 'user' ), function( module ) {
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnUserAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnUserListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnUserViewFactory',
    cenozo.getListModelInjectionList( 'user' ).concat( function() {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var object = function( parentModel ) { CnBaseViewFactory.construct( this, parentModel, args ); }
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    } )
  );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnUserModelFactory', [
    'CnBaseModelFactory', 'CnUserListFactory', 'CnUserAddFactory', 'CnUserViewFactory', 'CnHttpFactory',
    function( CnBaseModelFactory, CnUserListFactory, CnUserAddFactory, CnUserViewFactory, CnHttpFactory ) {
      var object = function() {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnUserAddFactory.instance( this );
        this.listModel = CnUserListFactory.instance( this );
        this.viewModel = CnUserViewFactory.instance( this );

        // extend getMetadata
        this.getMetadata = function() {
          this.metadata.loadingCount++;
          return this.loadMetadata().then( function() {
            return CnHttpFactory.instance( {
              path: 'role',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: { order: { name: false } },
                granting: true // only return roles which we can grant access to
              }
            } ).query().then( function success( response ) {
              self.metadata.columnList.role_id = {
                required: true,
                enumList: []
              };
              for( var i = 0; i < response.data.length; i++ ) {
                self.metadata.columnList.role_id.enumList.push( {
                  value: response.data[i].id,
                  name: response.data[i].name
                } );
              }
            } ).then( function() {
              return CnHttpFactory.instance( {
                path: 'site',
                data: {
                  select: { column: [ 'id', 'name' ] },
                  modifier: { order: { name: false } },
                  granting: true // only return sites which we can grant access to
                }
              } ).query().then( function success( response ) {
                self.metadata.columnList.site_id = {
                  required: true,
                  enumList: []
                };
                for( var i = 0; i < response.data.length; i++ ) {
                  self.metadata.columnList.site_id.enumList.push( {
                    value: response.data[i].id,
                    name: response.data[i].name
                  } );
                }
              } );
            } ).then( function() {
              self.metadata.loadingCount--;
            } );
          } );
        };
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
