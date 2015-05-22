define( [
  cenozo.baseUrl + '/app/application/module.js',
  cenozo.baseUrl + '/app/participant/controllers.js',
  cenozo.baseUrl + '/app/participant/directives.js',
  cenozo.baseUrl + '/app/participant/services.js',
  cenozo.baseUrl + '/app/site/controllers.js',
  cenozo.baseUrl + '/app/site/directives.js',
  cenozo.baseUrl + '/app/site/services.js',
  cenozo.baseUrl + '/app/user/controllers.js',
  cenozo.baseUrl + '/app/user/directives.js',
  cenozo.baseUrl + '/app/user/services.js'
], function( module ) {
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnApplicationAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); }; 
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnApplicationListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnApplicationViewFactory', [
    'CnBaseViewFactory', 'CnParticipantModelFactory', 'CnSiteModelFactory', 'CnUserModelFactory',
    function( CnBaseViewFactory, CnParticipantModelFactory, CnSiteModelFactory, CnUserModelFactory ) {
      var object = function( parentModel ) {
        CnBaseViewFactory.construct( this, parentModel );

        ////////////////////////////////////
        // factory customizations start here
        var self = this;
        this.cnParticipantModel = CnParticipantModelFactory.instance();
        this.cnParticipantModel.enableChoose( true );
        this.cnSiteModel = CnSiteModelFactory.instance();
        this.cnSiteModel.enableChoose( true );
        this.cnUserModel = CnUserModelFactory.instance();
        this.cnUserModel.enableChoose( true );

        this.view = function view() {
          return this.viewRecord().then( function() {
            self.cnParticipantModel.listModel.onList( true );
            self.cnSiteModel.listModel.onList( true );
            self.cnUserModel.listModel.onList( true );
          } );
        };
        // factory customizations end here
        //////////////////////////////////
      };

      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnApplicationModelFactory', [
    'CnBaseModelFactory', 'CnApplicationListFactory', 'CnApplicationAddFactory', 'CnApplicationViewFactory',
    function( CnBaseModelFactory, CnApplicationListFactory, CnApplicationAddFactory, CnApplicationViewFactory ) {
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnApplicationAddFactory.instance( this );
        this.listModel = CnApplicationListFactory.instance( this );
        this.viewModel = CnApplicationViewFactory.instance( this );

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
