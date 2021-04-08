define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'webphone', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {},
    name: {
      singular: 'webphone',
      plural: 'webphones',
      possessive: 'webphone\'s'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnWebphoneStatus', [
    'CnWebphoneStatusFactory', 'CnSession',
    function( CnWebphoneStatusFactory, CnSession ) {
      return {
        templateUrl: module.getFileUrl( 'status.tpl.html' ),
        restrict: 'E',
        controller: function( $scope ) {
          $scope.model = CnWebphoneStatusFactory.instance();
          CnSession.setBreadcrumbTrail( [ { title: 'Webphone' } ] );

          $scope.tab = 'server';
          $scope.webphoneHelp = 'If the box above doesn\'t display the webphone interface then please contact support.';
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnWebphoneStatusFactory', [
    'CnSession', 'CnHttpFactory', 'CnModalMessageFactory', '$http', '$interval', '$timeout',
    function( CnSession, CnHttpFactory, CnModalMessageFactory, $http, $interval, $timeout ) {
      var object = function( root ) {
        angular.extend( this, {
          updating: false,
          lastUpdate: null,
          webphone: '(disabled)',
          voip: CnSession.voip,
          webphoneUrl: CnSession.application.webphoneUrl,
          useRecording: CnSession.moduleList.includes( 'recording' ),
          lastLanguageId: null,
          playbackVolume: '0',
          voipOperation: null,
          timerValue: null,
          timerPromise: null,

          updateInformation: async function() {
            if( !this.updating ) {
              this.updating = true;
              try {
                await CnSession.updateVoip();

                this.voip = CnSession.voip;
                if( this.voip.enabled && null != this.voip.info && '(disabled)' == this.webphone ) {
                  // loading webphone from server which isn't part of the API, so use $http
                  var response = await $http.get( CnSession.application.webphoneUrl );
                  this.webphone = response.data;
                }
                this.lastUpdate = moment().tz( CnSession.user.timezone );
              } finally {
                this.updating = false;
              }
            }
          }
        } );

        if( this.useRecording ) {
          angular.extend( this, {
            recordingList: [],
            activeRecording: null,
            activeRecordingFile: null,

            startRecording: async function() {
              var self = this;
              this.voipOperation = null == this.activeRecordingFile ? 'monitoring' : 'playing';
              var data = {
                operation: null == this.activeRecordingFile ? 'start_monitoring' : 'play_sound',
                recording_id: this.activeRecording.id,
                volume: parseInt( this.playbackVolume )
              };
              if( this.activeRecording.record ) {
                data.recording_id = this.activeRecording.id;
              } else {
                data.recording_file_id = this.activeRecordingFile.id;
              }

              await CnHttpFactory.instance( {
                path: 'voip/0',
                data: data,
                onError: function( error ) {
                  self.voipOperation = null;
                  if( 404 == error.status ) {
                    // 404 means there is no active call
                    CnModalMessageFactory.instance( {
                      title: 'No Active Call',
                      message: 'The system was unable to start the recording since you do not appear to be ' +
                               'in a phone call.',
                      error: true
                    } ).show();
                  } else CnModalMessageFactory.httpError( error );
                }
              } ).patch();

              // start the timer
              if( null != this.timerValue && null == this.timerPromise ) {
                this.timerPromise = $interval( async function() {
                  self.timerValue++;

                  if( null == self.activeRecording.timer ) {
                    self.timerValue = null;
                    await self.stopRecording();
                  } else if( self.activeRecording.timer <= self.timerValue ) {
                    self.timerValue = self.activeRecording.timer;
                    await CnHttpFactory.instance( {
                      path: 'voip/0',
                      data: {
                        operation: 'play_sound',
                        filename: 'beep',
                        volume: parseInt( self.playbackVolume )
                      },
                      onError: function() {} // ignore all errors
                    } ).patch()
                    await self.stopRecording();
                  }
                }, 1000 );
              }
            },

            selectRecording: function() {
              if( 0 == this.activeRecording.fileList.length ) {
                this.activeRecordingFile = null;
              } else {
                // try and find the matching language
                var newRecording = this.activeRecording.fileList.findByProperty(
                  'language_id', this.lastLanguageId );
                if( null == newRecording ) newRecording = this.activeRecording.fileList[0];

                this.activeRecordingFile = newRecording;
              }

              // stop the timer
              this.timerValue = 0;
              if( null != this.timerPromise ) {
                $interval.cancel( this.timerPromise );
                this.timerPromise = null;
              }
            },

            selectRecordingFile: function() {
              if( this.activeRecordingFile )
                this.lastLanguageId = this.activeRecordingFile.language_id;
            },

            stopRecording: async function() {
              // stop the timer
              if( null != this.timerPromise ) {
                $interval.cancel( this.timerPromise );
                this.timerPromise = null;
              }

              await CnHttpFactory.instance( {
                path: 'voip/0',
                data: { operation: 'stop_monitoring' },
                onError: function() { this.voipOperation = null; }
              } ).patch();
              this.voipOperation = null;
            }
          } );

          async function init() {
            // get the recording and recording-file lists
            var response = await CnHttpFactory.instance( {
              path: 'recording'
            } ).get()

            self.recordingList = response.data.map( function( recording ) {
              return {
                id: recording.id,
                name: recording.rank + '. ' + recording.name,
                record: recording.record,
                timer: recording.timer,
                fileList: []
              };
            } );

            var response = await CnHttpFactory.instance( {
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
            } ).get();

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
          }

          init();
        }

        // update the information now and again in 10 seconds (to give the webphone applet time to load)
        this.updateInformation();
        var self = this;
        $timeout( function() { self.updateInformation(); }, 10000 );
      };

      return { instance: function() { return new object( false ); } };
    }
  ] );

} );
