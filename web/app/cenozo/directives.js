'use strict';

try { var cenozo = angular.module( 'cenozo' ); }
catch( err ) {
  var cenozo = angular.module( 'cenozo', [
    'ngAnimate',
    'ui.bootstrap.dateparser',
    'ui.bootstrap.position'
  ] );
}

/**
 * Prints the application title and version
 */
cenozo.directive( 'cnApplicationTitle', [
  'CnAppSingleton',
  function( CnAppSingleton ) {
    return {
      template: '{{ application.title }} {{ application.version }}',
      restrict: 'E',
      link: function( scope ) {
        CnAppSingleton.promise.then( function() {
          scope.application = CnAppSingleton.application;
        } );
      }
    };
  }
] );

/**
 * Like ngChange but will only trigger after loosing focus of the element (instead of any change)
 * if the parent element is an INPUT of type other than checkbox or radio, otherwise it is identical
 * to the standard ngChange directive.
 * @attr self
 */
cenozo.directive( 'cnChange', [
  '$timeout',
  function( $timeout ) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function( scope, element, attrs ) {
        var oldValue = null;
        element.bind( 'focus', function() {
          $timeout( function() { oldValue = element.val(); } );
        } );
        element.bind( 'blur', function() {
          scope.$evalAsync( function() {
            if( element.val() != oldValue ) {
              scope.$eval( attrs.cnChange );
            }
          } );
        } );
      }
    };
  }
] );

/**
 * Displays a clock including hours, minutes and timezone (based on the timezone of the site
 * that the user is currently logged into).
 */
cenozo.directive( 'cnClock', [
  'CnAppSingleton', '$interval',
  function( CnAppSingleton, $interval ) {
    return {
      restrict: 'E',
      link: function( scope, element, attrs ) {
        CnAppSingleton.promise.then( function() {
          function updateTime() {
            var now = moment();
            now.tz( CnAppSingleton.site.timezone );
            element.text( now.format( 'HH:mm z' ) );
          }

          updateTime();
          var promise = $interval( updateTime, 10000 );
          element.on( '$destroy', function() { $interval.cancel( promise ); } );
        } );
      }
    };
  }
] );

/**
 * A generic confirmation for risky actions.
 * @attr cn-really-message: The message to popup before proceeding
 * @attr cn-really-click: Callback function to call when action is confirmed
 * @attr cn-do-not-click: Callback function to call when action is cancelled
 */
cenozo.directive( 'cnReallyClick', [
  'CnModalConfirmFactory',
  function( CnModalConfirmFactory ) {
    return {
      restrict: 'A',
      link: function( scope, element, attrs ) {
        element.bind( 'click', function() {
          var message = attrs.cnReallyMessage;
          CnModalConfirmFactory.instance( {
            title: 'Confirm Delete',
            message: message
          } ).show().then( function( response ) {
            if( response ) {
              if( attrs.cnReallyClick ) scope.$evalAsync( attrs.cnReallyClick );
            } else {
              if( attrs.cnDoNotClick ) scope.$evalAsync( attrs.cnDoNotClick );
            }
          } );
        } );
      }
    }
  }
] );

/**
 * A form for filling out a new record's details
 * @attr model: An instance of the record's singleton model
 * @attr removeInputs: An array of inputs (by key) to remove from the form
 */
cenozo.directive( 'cnRecordAdd', [
  'CnHttpFactory',
  function( CnHttpFactory ) {
    return {
      templateUrl: cnCenozoUrl + '/app/cenozo/record-add.tpl.html',
      restrict: 'E',
      scope: {
        model: '=',
        removeInputs: '@'
      },
      controller: function( $scope ) {
        $scope.back = function() { $scope.model.transitionToLastState(); };
        $scope.submit = function() {
          if( !$scope.form.$valid ) {
            // dirty all inputs so we can find the problem
            var scope = angular.element(
              angular.element( document.querySelector( 'form' ) ) ).scope().$$childHead;
            while( null !== scope ) {
              var item = scope.$$childHead.$$nextSibling.$parent.innerForm.name;
              item.$dirty = true;
              scope = scope.$$nextSibling;
            }
          } else {
            $scope.model.cnAdd.onAdd( $scope.$parent.record ).then(
              function success( response ) { 
                $scope.model.cnAdd.onNew( $scope.$parent.record );
                $scope.form.$setPristine();
                $scope.model.transitionToLastState();
              },
              function error( response ) { 
                if( 409 == response.status ) { 
                  // report which inputs are included in the conflict
                  for( var i = 0; i < response.data.length; i++ ) { 
                    var elementScope = angular.element( angular.element(
                      document.querySelector( '#' + response.data[i] ) ) ).scope();
                    if( undefined !== elementScope ) {
                      var item = elementScope.$parent.innerForm.name;
                      item.$dirty = true;
                      item.$invalid = true;
                      item.$error.conflict = true;
                    }
                  }
                } else { $scope.model.transitionToErrorState( response ); }
              }
            );  
          }
        };
        $scope.getTypeaheadValues = function( key, viewValue ) {
          var input = $scope.model.inputList[key];
          if( undefined === input )
            throw 'Typeahead used without a valid input key (' + key + ').';
          if( undefined === input.table )
            throw 'Typeaheads require a value for "table" in the input list.';
          
          // create the where statement
          var where = {};
          if( undefined === input.where ) {
            where = {
              column: undefined === input.select ? 'name' : input.select,
              operator: 'like',
              value: viewValue + '%'
            };
          } else {
            where = [];
            var whereList = Array === input.where.constructor ? input.where : [ input.where ];
            for( var i = 0; i < whereList.length; i++ ) {
              where.push( {
                column: whereList[i],
                operator: 'like',
                value: viewValue + '%',
                or: true
              } );
            }
          }
          return CnHttpFactory.instance( {
            path: input.table,
            data: {
              select: {
                column: {
                  column: undefined === input.select ? 'name' : input.select,
                  alias: 'value',
                  table_prefix: false
                }
              },
              modifier: { where: where }
            }
          } ).get().then( function( response ) {
            return cnCopy( response.data );
          } );
        };
      },
      link: function( scope, element, attrs ) {
        scope.heading = attrs.heading;
        if( undefined === scope.heading ) {
          var parentSubject = scope.model.getParentSubject();
          scope.heading = 'Create ';
          scope.heading += parentSubject ? parentSubject.ucWords() + ' ' : '';
          scope.heading += scope.model.name.singular.ucWords();
        }

        // get the input array and add enum lists for boolean types
        scope.inputArray = scope.model.getInputArray( scope.removeInputs );
        for( var i = 0; i < scope.inputArray.length; i++ ) {
          if( 'boolean' == scope.inputArray[i].type ) {
            scope.inputArray[i].enumList = [
              { value: undefined, name: '(Select Yes or No)' },
              { value: true, name: 'Yes' },
              { value: false, name: 'No' }
            ];
          }
        }

        // watch for changes in the record (created asynchronously by the service)
        scope.$parent.$watch( 'record', function( record ) { scope.record = record; } );

        // watch for changes in metadata (created asynchronously by the service)
        scope.isComplete = false;
        scope.$watch( 'model.metadata', function( metadata ) {
          if( undefined !== metadata && 0 === metadata.loadingCount && !scope.isComplete ) {
            for( var i = 0; i < scope.inputArray.length; i++ ) {
              var input = scope.inputArray[i];
              var meta = metadata.columnList[input.key];
              if( undefined !== meta && undefined !== meta.enumList ) {
                input.enumList = meta.enumList;
                
                input.enumList.unshift( {
                  value: undefined,
                  name: meta.required ? '(Select ' + input.title + ')' : '(none)'
                } );

                // add additional rank
                if( 'rank' == input.key ) input.enumList.push( {
                  value: input.enumList.length,
                  name: input.enumList.length
                } );
              }
            }
            scope.isComplete = true;
          }
        }, true );
      }
    };
  }
] );

/**
 * A listing of records
 * @attr model: An instance of the record's singleton model
 * @attr removeColumns: An array of columns (by key) to remove from the list
 */
cenozo.directive( 'cnRecordList', [
  'CnModalMessageFactory', 'CnModalRestrictFactory',
  function( CnModalMessageFactory, CnModalRestrictFactory ) {
    return {
      templateUrl: cnCenozoUrl + '/app/cenozo/record-list.tpl.html',
      restrict: 'E',
      scope: {
        model: '=',
        removeColumns: '@'
      },
      controller: function( $scope ) {
        if( $scope.model.addEnabled ) {
          $scope.addRecord = function() { $scope.model.transitionToAddState(); };
        }

        if( $scope.model.deleteEnabled ) {
          $scope.deleteRecord = function( record ) {
            $scope.model.cnList.onDelete( record ).catch( function error( response ) {
              if( 409 == response.status ) {
                CnModalMessageFactory.instance( {
                  title: 'Unable to delete ' + $scope.model.name.singular + ' record',
                  message: 'It is not possible to delete this ' + $scope.model.name.singular +
                           ' record because it is being referenced by "' + response.data +
                           '" in the database.',
                  error: true
                } ).show();
              } else {
                $scope.model.transitionToErrorState( response );
              }
            } );
          };
        }

        if( $scope.model.chooseEnabled ) {
          $scope.chooseRecord = function( record ) {
            if( $scope.model.cnList.chooseMode ) {
              $scope.model.cnList.onChoose( record ).catch( function error( response ) {
                $scope.model.transitionToErrorState( response );
              } );
            }
          };
        }
        
        if( $scope.model.viewEnabled ) {
          $scope.selectRecord = function( record ) {
            $scope.model.transitionToViewState( record );
          };
        }
      },
      link: function( scope, element, attrs ) {
        scope.heading = undefined === attrs.heading
                      ? scope.model.name.singular.ucWords() + ' List'
                      : attrs.heading;

        scope.columnArray = scope.model.getColumnArray( scope.removeColumns );

        if( undefined !== scope.model.cnList.restrict ) {
          scope.addRestrict = function( column ) {
            var column = scope.columnArray.findByProperty( 'key', column );
            CnModalRestrictFactory.instance( {
              name: scope.model.name,
              column: column.title,
              comparison: column.restrict
            } ).show().then( function( comparison ) {
              scope.model.cnList.restrict( column.key, comparison );
            } );
          };
        }

        // get the total number of columns in the table
        scope.numColumns = scope.columnArray.length;
        if( scope.model.deleteEnabled ) scope.numColumns++;
      }
    };
  }
] );

/**
 * A form for editing an existing record's details
 * @attr model: An instance of the record's singleton model
 * @attr removeInputs: An array of inputs (by key) to remove from the form
 */
cenozo.directive( 'cnRecordView', [
  'CnModalDatetimeFactory', 'CnAppSingleton',
  function( CnModalDatetimeFactory, CnAppSingleton ) {
    return {
      templateUrl: cnCenozoUrl + '/app/cenozo/record-view.tpl.html',
      restrict: 'E',
      scope: {
        model: '=',
        removeInputs: '@'
      },
      controller: function( $scope ) {
        $scope.back = function() {
          $scope.model.transitionToLastState();
        };

        $scope.delete = function() {
          $scope.model.cnView.onDelete().then(
            function success() { $scope.model.transitionToLastState(); },
            function error( response ) { $scope.model.transitionToErrorState( response ); }
          );
        };

        $scope.patch = function( property ) {
          var data = {};
          data[property] = $scope.model.cnView.record[property];
          $scope.model.cnView.onPatch( data ).then(
            function success() { 
              // if the data in the identifier was patched then reload with the new url
              if( 0 <= $scope.model.cnView.record.getIdentifier().split( /[;=]/ ).indexOf( property ) ) {
                $scope.model.reloadState( $scope.model.cnView.record );
              } else {
                var scope = angular.element(
                  angular.element( document.querySelector( '#' + property ) ) ).scope();
                // if a conflict has been resolved then clear it throughout the form
                var currentItem = scope.$parent.innerForm.name;
                if( currentItem.$error.conflict ) {
                  var sibling = scope.$parent.$parent.$$childHead;
                  while( null !== sibling ) {
                    var siblingItem = sibling.$$childHead.$$nextSibling.$parent.innerForm.name;
                    if( siblingItem.$error.conflict ) { 
                      siblingItem.$dirty = false;
                      siblingItem.$invalid = false;
                      siblingItem.$error.conflict = false;
                    }
                    sibling = sibling.$$nextSibling;
                  }
                }

                /* Removing the following because it was interfering with $error.required
                // now clean up this property's form elements
                currentItem.$error = {};
                */
              }
            },
            function error( response ) { 
              if( 409 == response.status ) { 
                // report which inputs are included in the conflict
                for( var i = 0; i < response.data.length; i++ ) { 
                  var item = angular.element(
                    angular.element( document.querySelector( '#' + response.data[i] ) ) ).
                      scope().$parent.innerForm.name;
                  item.$dirty = true;
                  item.$invalid = true;
                  item.$error.conflict = true;
                }
              } else { $scope.model.transitionToErrorState( response ); }
            }
          );
        };

        $scope.selectDatetime = function( input ) {
          CnModalDatetimeFactory.instance( {
            title: input.title,
            date: $scope.model.cnView.record[input.key],
            pickerType: input.type
          } ).show().then( function( response ) {
            if( false !== response ) {
              $scope.model.cnView.record[input.key] = response;
              $scope.patch( input.key );
              input.formattedValue = CnAppSingleton.formatDatetime( response, input.type );
            }
          } );
        };
      },
      link: function( scope, element, attrs ) {
        scope.heading = attrs.heading;
        if( undefined === scope.heading ) {
          var parentSubject = scope.model.getParentSubject();
          scope.heading = parentSubject ? parentSubject.ucWords() + ' ' : '';
          scope.heading += scope.model.name.singular.ucWords() + ' Details';
        }

        var recordLoaded = false;
        scope.inputArray = scope.model.getInputArray( scope.removeInputs );
        scope.$watch( 'model.cnView.record', function( record ) {
          // convert datetimes
          if( undefined !== record.id && !recordLoaded ) {
            for( var i = 0; i < scope.inputArray.length; i++ ) {
              var key = scope.inputArray[i].key;
              if( 'datetimesecond' == scope.inputArray[i].type ||
                  'datetime' == scope.inputArray[i].type ||
                  'date' == scope.inputArray[i].type ||
                  'timesecond' == scope.inputArray[i].type ||
                  'time' == scope.inputArray[i].type ) {
                scope.inputArray[i].formattedValue =
                  CnAppSingleton.formatDatetime( record[key], scope.inputArray[i].type );
              }
            }
            recordLoaded = true;
            if( recordLoaded && metadataLoaded ) scope.isComplete = true;
          }
        } );

        // watch for changes in metadata (created asynchronously by the service)
        var metadataLoaded = false;
        scope.isComplete = false;
        scope.$watch( 'model.metadata', function( metadata ) {
          if( undefined !== metadata &&
              undefined !== metadata.columnList &&
              0 === metadata.loadingCount &&
              !metadataLoaded ) {
            // build enum lists
            for( var key in metadata.columnList ) {
              var input = scope.inputArray.findByProperty( 'key', key );
              if( input && 0 <= ['boolean', 'enum', 'rank'].indexOf( input.type ) ) {
                input.enumList = 'boolean' === input.type
                               ? [ { value: true, name: 'Yes' }, { value: false, name: 'No' } ]
                               : metadata.columnList[key].enumList.slice();
                if( !metadata.columnList[key].required ) input.enumList.unshift( { value: '', name: '(none)' } );
              }
            }
            metadataLoaded = true;
            if( recordLoaded && metadataLoaded ) scope.isComplete = true;
          }
        }, true );
      }
    };
  }
] );

/**
 * Site and role drop-downs which will switch the user's current role
 */
cenozo.directive( 'cnSiteRoleSwitcher', [
  '$window', 'CnAppSingleton',
  function( $window, CnAppSingleton ) {
    return {
      templateUrl: cnCenozoUrl + '/app/cenozo/site-role-switcher.tpl.html',
      restrict: 'E',
      controller: function( $scope ) {
        $scope.setSite = function( id ) {
          CnAppSingleton.setSite( id ).then( function() {
            // relist and set the url to the home state
            $window.location.assign( $window.location.pathname );
          } );
        }

        $scope.setRole = function( id ) {
          CnAppSingleton.setRole( id ).then( function() {
            // relist and set the url to the home state
            $window.location.assign( $window.location.pathname );
          } );
        }
      },
      link: function( scope ) {
        CnAppSingleton.promise.then( function() {
          scope.site = CnAppSingleton.site;
          scope.role = CnAppSingleton.role;
          scope.siteList = CnAppSingleton.siteList;

          // pre-select the role list
          for( var i = 0; i < scope.siteList.length; i++ )
            if( scope.site.id == scope.siteList[i].id )
              scope.roleList = scope.siteList[i].roleList;
        } );
      }
    };
  }
] );

/**
 * Displays a group of buttons that provide various tools which may be used in any state.
 */
cenozo.directive( 'cnToolbelt', [
  'CnAppSingleton', 'CnModalTimezoneCalculatorFactory',
  function( CnAppSingleton, CnModalTimezoneCalculatorFactory ) {
    return {
      restrict: 'E',
      templateUrl: cnCenozoUrl + '/app/cenozo/toolbelt.tpl.html',
      controller: function( $scope ) {
        $scope.openTimezoneCalculator = function() {
          CnModalTimezoneCalculatorFactory.instance().show();
        };
      },
      link: function( scope, element, attrs ) {
      }
    };
  }
] );

