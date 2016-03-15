define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'webphone', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {},
    name: {
      singular: 'webphone',
      plural: 'webphones',
      possessive: 'webphone\'s',
      pluralPossessive: 'webphones\''
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnWebphoneStatus', [
    'CnWebphoneStatusFactory', 'CnSession', '$interval',
    function( CnWebphoneStatusFactory, CnSession, $interval ) {
      return {
        templateUrl: module.getFileUrl( 'status.tpl.html' ),
        restrict: 'E',
        controller: function( $scope ) {
          $scope.model = CnWebphoneStatusFactory.instance();
          CnSession.setBreadcrumbTrail( [ { title: 'Webphone' } ] );

          $scope.tab = 'server';
          $scope.javaHelp =
            'If you see a "Java Application Blocked" message or the box above doesn\'t display the webphone ' +
            'interface then you must grant access to this website in your Java Control Panel. ' +
            'From your computer launch the "Configure Java" program, click on the "Security" tab then add ' +
            '"' + window.location.origin + '" to the Exception Site List.  Then reload your web browser ' +
            'and allow the webphone to be run on your computer (it is not a security risk).';

          var promise = $interval( $scope.model.updateInformation, 10000 );
          $scope.$on( '$destroy', function() { $interval.cancel( promise ); } );
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnWebphoneStatusFactory', [
    'CnSession', 'CnHttpFactory', 'CnModalMessageFactory', '$http',
    function( CnSession, CnHttpFactory, CnModalMessageFactory, $http ) {
      var object = function( root ) {
        var self = this;
        this.updating = false;
        this.voip = CnSession.voip;
        this.webphone = '(disabled)';
        this.webphoneUrl = CnSession.application.webphoneUrl;
        this.recordingList = [];
        this.activeRecording = null;
        this.activeRecordingFile = null;
        this.lastLanguageId = null;
        this.voipOperation = null;

        this.updateInformation = function() {
          if( !self.updating ) {
            self.updating = true;
            CnSession.updateVoip().then( function() {
              self.voip = CnSession.voip;
              if( self.voip.enabled && '(disabled)' == self.webphone ) {
                // loading webphone from server which isn't part of the API, so use $http
                $http.get( CnSession.application.webphoneUrl ).then( function( response ) {
                  self.webphone = response.data;
                } );
              }
              self.updating = false;
            } );
          }
        };

        this.updateInformation();

        this.startRecording = function() {
          this.voipOperation = null == this.activeRecordingFile ? 'monitoring' : 'playing';
          var data = {
            operation: null == this.activeRecordingFile ? 'start_monitoring' : 'play_sound',
            recording_id: this.activeRecording.id
          };
          if( this.activeRecording.record ) {
            data.recording_id = this.activeRecording.id;
          } else {
            data.recording_file_id = this.activeRecordingFile.id;
          }
          
          CnHttpFactory.instance( {
            path: 'voip/0',
            data: data,
            onError: function( response ) {
              self.voipOperation = null;
              if( 404 == response.status ) {
                // 404 means there is no active call
                CnModalMessageFactory.instance( {
                  title: 'No Active Call',
                  message: 'The system was unable to start the recording since you do not appear to be ' +
                           'in a phone call.',
                  error: true
                } ).show();
              } else CnModalMessageFactory.httpError( response );
            }
          } ).patch();
        };

        this.selectRecording = function() {
          if( 0 == this.activeRecording.fileList.length ) {
            this.activeRecordingFile = null;
          } else {
            // try and find the matching language
            var newRecording = this.activeRecording.fileList.findByProperty(
              'language_id', this.lastLanguageId );
            console.log( this.activeRecording.fileList );
            if( null == newRecording ) newRecording = this.activeRecording.fileList[0];

            this.activeRecordingFile = newRecording;
          }
        };

        this.selectRecordingFile = function() {
          if( this.activeRecordingFile )
            this.lastLanguageId = this.activeRecordingFile.language_id;
        };

        this.stopRecording = function() {
          CnHttpFactory.instance( {
            path: 'voip/0',
            data: { operation: 'stop_monitoring' },
            onError: function( response ) {
              self.voipOperation = null;
              // ignore 404's, it just means there is no active call
              if( 404 != response.status ) CnModalMessageFactory.httpError( response );
            }
          } ).patch().then( function() {
            self.voipOperation = null;
          } );
        };

        // get the recording and recording-file lists
        CnHttpFactory.instance( {
          path: 'recording'
        } ).get().then( function( response ) {
          self.recordingList = response.data.map( function( recording ) {
            return {
              id: recording.id,
              name: recording.rank + '. ' + recording.name,
              record: recording.record,
              timer: recording.timer,
              fileList: []
            };
          } );

          CnHttpFactory.instance( {
            path: 'recording_file',
            data: {
              select: {
                column: [ 'id', 'recording_id', {
                  table: 'language', column: 'id', alias: 'language_id'
                }, {
                  table: 'language', column: 'name', alias: 'language'
                } ]
              }
            }
          } ).get().then( function( response ) {
            response.data.forEach( function( file ) {
              self.recordingList.findByProperty( 'id', file.recording_id ).fileList.push( {
                id: file.id,
                language_id: file.language_id,
                name: file.language
              } );
            } );

            // now select a default recording and language
            if( 0 < self.recordingList.length ) {
              self.activeRecording = self.recordingList[0];
              if( 0 < self.activeRecording.fileList.length ) {
                self.activeRecordingFile = self.activeRecording.fileList[0];
                self.lastLanguageId = self.activeRecordingFile.language_id;
              }
            }
          } );
        } );
      };

      return { instance: function() { return new object( false ); } };
    }
  ] );

} );
