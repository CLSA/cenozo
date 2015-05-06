define( [
  cnCenozoUrl + '/app/application/module.js',
  cnCenozoUrl + '/app/participant/controllers.js',
  cnCenozoUrl + '/app/participant/directives.js',
  cnCenozoUrl + '/app/participant/services.js',
  cnCenozoUrl + '/app/site/controllers.js',
  cnCenozoUrl + '/app/site/directives.js',
  cnCenozoUrl + '/app/site/services.js',
  cnCenozoUrl + '/app/user/controllers.js',
  cnCenozoUrl + '/app/user/directives.js',
  cnCenozoUrl + '/app/user/services.js'
], function( module ) {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnApplicationAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); }; 
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnApplicationListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnApplicationViewFactory', [
    'CnBaseViewFactory', 'CnParticipantModelFactory', 'CnSiteModelFactory', 'CnUserModelFactory',
    function( CnBaseViewFactory, CnParticipantModelFactory, CnSiteModelFactory, CnUserModelFactory ) {
      var object = function( parentModel ) {
        CnBaseViewFactory.construct( this, parentModel );

        ////////////////////////////////////
        // factory customizations start here
        this.cnParticipantModel = CnParticipantModelFactory.instance();
        this.cnParticipantModel.enableChoose( true );
        this.cnSiteModel = CnSiteModelFactory.instance();
        this.cnSiteModel.enableChoose( true );
        this.cnUserModel = CnUserModelFactory.instance();
        this.cnUserModel.enableChoose( true );
        var thisRef = this;
        this.view = function view() {
          return this.viewRecord().then( function() {
            thisRef.cnParticipantModel.cnList.onList( true );
            thisRef.cnSiteModel.cnList.onList( true );
            thisRef.cnUserModel.cnList.onList( true );
          } );
        };
        // factory customizations end here
        //////////////////////////////////
      };

      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnApplicationModelFactory', [
    'CnBaseModelFactory', 'CnApplicationListFactory', 'CnApplicationAddFactory', 'CnApplicationViewFactory',
    function( CnBaseModelFactory, CnApplicationListFactory, CnApplicationAddFactory, CnApplicationViewFactory ) {
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.cnAdd = CnApplicationAddFactory.instance( this );
        this.cnList = CnApplicationListFactory.instance( this );
        this.cnView = CnApplicationViewFactory.instance( this );

        this.enableAdd( true );
        this.enableDelete( true );
        this.enableView( true );

        // process metadata
        var thisRef = this;
        this.promise.then( function() { thisRef.metadata.isLoading = false; } );
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
