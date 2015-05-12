define( [
  cnCenozoUrl + '/app/user/module.js',
  cnCenozoUrl + '/app/access/controllers.js',
  cnCenozoUrl + '/app/access/directives.js',
  cnCenozoUrl + '/app/access/services.js'
], function( module ) {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnUserAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); }; 
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnUserListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnUserViewFactory', [
    'CnBaseViewFactory', 'CnAccessModelFactory',
    function( CnBaseViewFactory, CnAccessModelFactory ) {
      var object = function( parentModel ) {
        CnBaseViewFactory.construct( this, parentModel );

        ////////////////////////////////////
        // factory customizations start here
        this.cnAccessModel = CnAccessModelFactory.instance();
        this.cnAccessModel.enableAdd( true );
        this.cnAccessModel.enableDelete( true );
        var thisRef = this;
        this.onView = function view() { 
          return this.viewRecord().then( function() {
            thisRef.cnAccessModel.cnList.onList( true );
          } );
        };
        // factory customizations end here
        //////////////////////////////////
      }   

      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnUserModelFactory', [
    'CnBaseModelFactory', 'CnUserListFactory', 'CnUserAddFactory', 'CnUserViewFactory',
    function( CnBaseModelFactory, CnUserListFactory, CnUserAddFactory, CnUserViewFactory ) {
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.cnAdd = CnUserAddFactory.instance( this );
        this.cnList = CnUserListFactory.instance( this );
        this.cnView = CnUserViewFactory.instance( this );

        this.enableAdd( true );
        this.enableDelete( true );
        this.enableView( true );

        // customize identifier
        this.getIdentifierFromRecord = function( record ) { return 'name=' + record.name; };
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
