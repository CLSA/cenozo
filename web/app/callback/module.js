define( [ 'participant', 'site' ].reduce( function( list, name ) {
  return list.concat( cenozoApp.module( name ).getRequiredFiles() );
}, [] ), function() {
  'use strict';

  try { var module = cenozoApp.module( 'callback', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {},
    name: {
      singular: 'callback',
      plural: 'callbacks',
      possessive: 'callback\'s',
      pluralPossessive: 'callbacks\''
    }
  } );

  // converts participant callbacks into events
  function getEventFromParticipant( participant, timezone ) {
    if( angular.isDefined( participant.start ) ) {
      return participant;
    } else {
      var date = moment( participant.callback );
      var offset = moment.tz.zone( timezone ).offset( date.unix() );

      // adjust the appointment for daylight savings time
      if( date.tz( timezone ).isDST() ) offset += -60;

      event = {
        getIdentifier: function() { return participant.getIdentifier(); },
        title: participant.uid,
        start: moment( participant.callback )
      };

      return event;
    }
  }

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnCallbackCalendar', [
    'CnCallbackModelFactory',
    function( CnCallbackModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'calendar.tpl.html' ),
        restrict: 'E',
        scope: {
          model: '=?',
          preventSiteChange: '@'
        },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnCallbackModelFactory.instance();
          $scope.model.calendarModel.heading = $scope.model.site.name.ucWords() + ' Callback Calendar';
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnCallbackCalendarFactory', [
    'CnBaseCalendarFactory', 'CnSession', 'CnParticipantModelFactory',
    function( CnBaseCalendarFactory, CnSession, CnParticipantModelFactory ) {
      var object = function( parentModel, site ) {
        var self = this;
        CnBaseCalendarFactory.construct( this, parentModel );

        // remove day click callbacks
        delete this.settings.dayClick;

        // define a special event click callback
        this.settings.eventClick = function( record ) {
          CnParticipantModelFactory.root.transitionToViewState( record );
        };

        // extend onCalendar to transform templates into events
        this.onCalendar = function( replace, minDate, maxDate, ignoreParent ) {
          // we must get the load dates before calling $$onCalendar
          var loadMinDate = self.getLoadMinDate( replace, minDate );
          var loadMaxDate = self.getLoadMaxDate( replace, maxDate );
          return self.$$onCalendar( replace, minDate, maxDate, ignoreParent ).then( function() {
            self.cache.forEach( function( item, index, array ) {
              array[index] = getEventFromParticipant( item, CnSession.user.timezone );
            } );
          } );
        };
      };

      return { instance: function( parentModel, site ) { return new object( parentModel, site ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnCallbackModelFactory', [
    'CnBaseModelFactory', 'CnCallbackCalendarFactory', 'CnSession', '$state',
    function( CnBaseModelFactory, CnCallbackCalendarFactory, CnSession, $state ) {
      var object = function( site ) {
        if( !angular.isObject( site ) || angular.isUndefined( site.id ) )
          throw new Error( 'Tried to create CnCallbackModel without specifying the site.' );

        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.calendarModel = CnCallbackCalendarFactory.instance( this, site );
        this.site = site;

        this.getServiceData = function( type, columnRestrictLists ) {
          var data = this.$$getServiceData( type, columnRestrictLists );
          data.select = { column: [ 'id', 'uid', 'callback' ] };
          return data;
        };
      };

      // get the siteColumn to be used by a site's identifier
      var siteModule = cenozoApp.module( 'site' );
      var siteColumn = angular.isDefined( siteModule.identifier.column ) ? siteModule.identifier.column : 'id';

      return {
        siteInstanceList: {},
        forSite: function( site ) {
          if( !angular.isObject( site ) ) {
            $state.go( 'error.404' );
            throw new Error( 'Cannot find site matching identifier "' + site + '", redirecting to 404.' );
          }
          if( angular.isUndefined( this.siteInstanceList[site.id] ) ) {
            if( angular.isUndefined( site.getIdentifier ) )
              site.getIdentifier = function() { return siteColumn + '=' + this[siteColumn]; };
            this.siteInstanceList[site.id] = new object( site );
          }
          return this.siteInstanceList[site.id];
        },
        instance: function() {
          var site = null;
          if( 'calendar' == $state.current.name.split( '.' )[1] ) {
            if( angular.isDefined( $state.params.identifier ) ) {
              var identifier = $state.params.identifier.split( '=' );
              if( 2 == identifier.length )
                site = CnSession.siteList.findByProperty( identifier[0], identifier[1] );
            }
          } else {
            site = CnSession.site;
          }
          return this.forSite( site );
        }
      };
    }
  ] );

} );
