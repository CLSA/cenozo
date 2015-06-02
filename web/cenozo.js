'use strict';

try { var cenozo = angular.module( 'cenozo' ); }
catch( err ) { var cenozo = angular.module( 'cenozo', ['ngAnimate'] ); }

// set up cenozo's base variables
cenozo.providers = {};
var baseCenozoUrl = document.getElementById( 'cenozo' ).src;
cenozo.baseUrl = baseCenozoUrl.substr( 0, baseCenozoUrl.indexOf( '/cenozo.js' ) );
baseCenozoUrl = undefined;

// setup moment.timezone
moment.tz.setDefault( 'UTC' );

// add some useful prototype functions
Array.prototype.findByProperty = function( property, value ) {
  for( var i = 0; i < this.length; i++ )
    if( angular.isDefined( this[i][property] ) && value == this[i][property] )
      return this[i];
  return null;
}

String.prototype.snakeToCamel = function cnSnakeToCamel( first ) {
  if( angular.isUndefined( first ) ) first = false;
  var output = this.replace( /(\_\w)/g, function( $1 ) { return angular.uppercase( $1[1] ); } );
  if( first ) output = angular.uppercase( output.charAt(0) ) + output.slice(1);
  return output;
};

String.prototype.camelToSnake = function cnCamelToSnake() {
  return this.replace( /([A-Z])/g, function( $1 ) { return '_' + angular.lowercase( $1 ); } ).replace( /^_/, '' );
};

String.prototype.ucWords = function() {
  return this.replace( /(^[a-z]| [a-z])/g, function( $1 ) { return angular.uppercase( $1 ); } );
}

// Used to define which modules are part of the framework
cenozo.modules = function( modules ) { this.moduleList = angular.copy( modules ); };

// Used to determine whether a module is part of the framework
cenozo.isFrameworkModule = function( moduleName ) { return 0 <= this.moduleList.indexOf( moduleName ); };

// Used to set up the routing for a module
cenozo.routeModule = function ( stateProvider, name, module ) {
  if( angular.isUndefined( stateProvider ) ) throw 'routeModule requires exactly 3 parameters';
  if( angular.isUndefined( name ) ) throw 'routeModule requires exactly 3 parameters';
  if( angular.isUndefined( module ) ) throw 'routeModule requires exactly 3 parameters';

  // add base state
  stateProvider.state( name, {
    abstract: true,
    url: '/' + name,
    template: '<div ui-view class="inner-view-frame fade-transition"></div>',
    resolve: {
      data: [ '$q', function( $q ) {
        var deferred = $q.defer();
        var bootstrapUrl = 'app/' + name + '/bootstrap.js';
        if( cenozo.isFrameworkModule( name ) )
          bootstrapUrl = cenozo.baseUrl + '/' + bootstrapUrl;
        require( [ bootstrapUrl ], function() { deferred.resolve(); } );
        return deferred.promise;
      } ]
    }
  } );

  // add action states
  var baseUrl = 'app/' + name + '/';
  if( cenozo.isFrameworkModule( name ) ) baseUrl = this.baseUrl + '/' + baseUrl;
  for( var i = 0; i < module.actions.length; i++ ) {
    var action = module.actions[i];
    if( 0 > ['add', 'list', 'view'].indexOf( action ) ) {
      stateProvider.state( name + '.' + action, { abstract: true } );
    } else {
      var url = '/' + action;
      if( 'view' == action ) url += '/{identifier}';
      var templateUrl = baseUrl + action + '.tpl.html';

      stateProvider.state( name + '.' + action, {
        url: url,
        controller: ( name + '_' + action + '_ctrl' ).snakeToCamel( true ),
        templateUrl: templateUrl
      } );
    }
  }

  // add child states to the list
  for( var i = 0; i < module.children.length; i++ ) {
    var child = module.children[i];
    var baseChildUrl = 'app/' + child + '/';
    if( cenozo.isFrameworkModule( child ) ) baseChildUrl = this.baseUrl + '/' + baseChildUrl;

    stateProvider.state( name + '.add_' + child, {
      url: '/view/{parentIdentifier}/' + child,
      controller: ( child + '_add_ctrl' ).snakeToCamel( true ),
      templateUrl: baseChildUrl + 'add.tpl.html'
    } );

    stateProvider.state( name + '.view_' + child, {
      url: '/view/{parentIdentifier}/' + child + '/{identifier}',
      controller: ( child + '_view_ctrl' ).snakeToCamel( true ),
      templateUrl: baseChildUrl + 'view.tpl.html'
    } );
  }
};

// Used to set up the routing for a module
cenozo.updateFormElement = function updateFormElement( item ) {
  var invalid = false;
  for( var error in item.$error ) {
    invalid = true === item.$error[error];
    if( invalid ) break;
  }
  item.$dirty = invalid;
  item.$invalid = invalid;
};

/* ######################################################################################################## */

/**
 * TODO: document
 */
cenozo.animation( '.fade-transition', function() {
  return {
    enter: function( element, done ) {
      element.css( 'display', 'none' );
      element.fadeIn( 500, done );
      return function() { element.stop(); }
    },
    leave: function( element, done ) {
      element.fadeOut( 250, done )
      return function() { element.stop(); }
    }
  }
} );

/* ######################################################################################################## */

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

/* ######################################################################################################## */

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

/* ######################################################################################################## */

/**
 * Displays a clock including hours, minutes and timezone (based on the timezone of the site
 * that the user is currently logged into).
 */
cenozo.directive( 'cnClock', [
  '$interval', '$timeout', '$window', 'CnAppSingleton', 'CnModalTimezoneFactory',
  function( $interval, $timeout, $window, CnAppSingleton, CnModalTimezoneFactory ) {
    return {
      restrict: 'E',
      templateUrl: cenozo.baseUrl + '/app/cenozo/clock.tpl.html',
      link: function( scope, element ) {
        CnAppSingleton.promise.then( function() {
          scope.chooseTimezone = function() {
            CnModalTimezoneFactory.instance( {
              timezone: CnAppSingleton.user.timezone
            } ).show().then( function( response ) {
              if( response && response != CnAppSingleton.user.timezone ) {
                // fade the body while we reload
                $timeout( function() {
                  var body = document.getElementsByTagName( 'body' )[0];
                  body.className = body.className + ' greyout';
                }, 200 );
                CnAppSingleton.setTimezone( response ).then( function() { $window.location.reload(); } );
              }
            } );
          };

          function updateTime() {
            var now = moment();
            now.tz( CnAppSingleton.user.timezone );
            scope.time = now.format( 'HH:mm z' );
          }

          updateTime();
          var promise = $interval( updateTime, 10000 );
          element.on( '$destroy', function() { $interval.cancel( promise ); } );
        } );
      }
    };
  }
] );

/* ######################################################################################################## */

/**
 * Changes element height based on scroll height
 */
cenozo.directive( 'cnElastic', [
  '$timeout',
  function( $timeout ) {
    return {
      restrict: 'A',
      link: function( $scope, element ) {
        $scope.initialHeight = $scope.initialHeight || element[0].style.height;
        var resize = function() {
          element[0].style.height = $scope.initialHeight;
          element[0].style.height = '' + element[0].scrollHeight + 'px';
        };
        element.on( 'blur keyup change', resize );
        $timeout( resize, 200 );
      }
    };
  }
]);

/* ######################################################################################################## */

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

/* ######################################################################################################## */

/**
 * A form for filling out a new record's details
 * @attr model: An instance of the record's singleton model
 * @attr removeInputs: An array of inputs (by key) to remove from the form
 */
cenozo.directive( 'cnRecordAdd', [
  'CnModalDatetimeFactory', 'CnHttpFactory', 'CnModalMessageFactory',
  function( CnModalDatetimeFactory, CnHttpFactory, CnModalMessageFactory ) {
    return {
      templateUrl: cenozo.baseUrl + '/app/cenozo/record-add.tpl.html',
      restrict: 'E',
      scope: {
        model: '=',
        removeInputs: '@'
      },
      controller: function( $scope ) {
        $scope.back = function() { $scope.model.transitionToLastState(); };

        $scope.check = function( property ) {
          // test the format
          var item = angular.element(
            angular.element( document.querySelector( '#' + property ) ) ).
              scope().$parent.innerForm.name;
          if( item ) {
            var valid = $scope.model.testFormat( property, $scope.record[property] );
            item.$error.format = !valid;
            cenozo.updateFormElement( item );
          }
        };

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
            $scope.model.addModel.onAdd( $scope.$parent.record ).then(
              function success( response ) {
                $scope.model.addModel.onNew( $scope.$parent.record );
                $scope.form.$setPristine();
                $scope.model.transitionToLastState();
              },
              function error( response ) {
                if( 406 == response.status ) {
                  CnModalMessageFactory.instance( {
                    title: 'Please Note',
                    message: response.data,
                    error: true
                  } ).show();
                } else if( 409 == response.status ) {
                  // report which inputs are included in the conflict
                  for( var i = 0; i < response.data.length; i++ ) {
                    var elementScope = angular.element( angular.element(
                      document.querySelector( '#' + response.data[i] ) ) ).scope();
                    if( angular.isDefined( elementScope ) ) {
                      var item = elementScope.$parent.innerForm.name;
                      item.$error.conflict = true;
                      cenozo.updateFormElement( item );
                    }
                  }
                } else { $scope.model.transitionToErrorState( response ); }
              }
            );
          }
        };

        $scope.getTypeaheadValues = function( input, viewValue ) {
          return $scope.model.getTypeaheadValues( input, viewValue );
        };

        $scope.onSelectTypeahead = function( input, $item, $model, $label ) {
          if( 'lookup-typeahead' == input.type ) {
            $scope.formattedRecord[input.key] = $label;
            $scope.record[input.key] = $model;
          } else {
            $scope.record[input.key] = $item;
          }
        };

        $scope.selectDatetime = function( input ) {
          CnModalDatetimeFactory.instance( {
            title: input.title,
            date: $scope.record[input.key],
            pickerType: input.type
          } ).show().then( function( response ) {
            if( false !== response ) {
              $scope.record[input.key] = response;
              $scope.formattedRecord[input.key] = $scope.model.formatValue( input.key, response );
            }
          } );
        };
      },
      link: function( scope, element, attrs ) {
        scope.record = {};
        scope.formattedRecord = {};

        scope.heading = attrs.heading;
        if( angular.isUndefined( scope.heading ) ) {
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
          if( angular.isDefined( metadata ) && 0 === metadata.loadingCount && !scope.isComplete ) {
            for( var i = 0; i < scope.inputArray.length; i++ ) {
              var input = scope.inputArray[i];
              var meta = metadata.columnList[input.key];
              if( angular.isDefined( meta ) && angular.isDefined( meta.enumList ) ) {
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

/* ######################################################################################################## */

/**
 * A listing of records
 * @attr model: An instance of the record's singleton model
 * @attr removeColumns: An array of columns (by key) to remove from the list
 */
cenozo.directive( 'cnRecordList', [
  'CnModalMessageFactory', 'CnModalRestrictFactory',
  function( CnModalMessageFactory, CnModalRestrictFactory ) {
    return {
      templateUrl: cenozo.baseUrl + '/app/cenozo/record-list.tpl.html',
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
            $scope.model.listModel.onDelete( record ).catch( function error( response ) {
              if( 406 == response.status ) {
                CnModalMessageFactory.instance( {
                  title: 'Please Note',
                  message: response.data,
                  error: true
                } ).show();
              } else if( 409 == response.status ) {
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
            if( $scope.model.listModel.chooseMode ) {
              $scope.model.listModel.onChoose( record ).catch( function error( response ) {
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
        scope.heading = angular.isUndefined( attrs.heading )
                      ? scope.model.name.singular.ucWords() + ' List'
                      : attrs.heading;

        scope.columnArray = scope.model.getColumnArray( scope.removeColumns );

        if( angular.isDefined( scope.model.listModel.restrict ) ) {
          scope.addRestrict = function( column ) {
            var column = scope.columnArray.findByProperty( 'key', column );
            CnModalRestrictFactory.instance( {
              name: scope.model.name,
              column: column.title,
              comparison: column.restrict
            } ).show().then( function( comparison ) {
              scope.model.listModel.restrict( column.key, comparison );
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

/* ######################################################################################################## */

/**
 * A form for editing an existing record's details
 * @attr model: An instance of the record's singleton model
 * @attr removeInputs: An array of inputs (by key) to remove from the form
 */
cenozo.directive( 'cnRecordView', [
  'CnModalDatetimeFactory', 'CnModalMessageFactory', 'CnAppSingleton',
  function( CnModalDatetimeFactory, CnModalMessageFactory, CnAppSingleton ) {
    return {
      templateUrl: cenozo.baseUrl + '/app/cenozo/record-view.tpl.html',
      restrict: 'E',
      scope: {
        model: '=',
        removeInputs: '@'
      },
      controller: function( $scope ) {
        $scope.back = function() {
          $scope.model.transitionToLastState();
        };

        if( $scope.model.deleteEnabled ) {
          $scope.delete = function() {
            $scope.model.viewModel.onDelete().then(
              function success() { $scope.model.transitionToLastState(); },
              function error( response ) { $scope.model.transitionToErrorState( response ); }
            );
          };
        }

        if( $scope.model.editEnabled ) {
          $scope.undo = function( property ) {
            if( $scope.model.viewModel.record[property] != $scope.model.viewModel.backupRecord[property] ) {
              $scope.model.viewModel.record[property] = $scope.model.viewModel.backupRecord[property];
              if( angular.isDefined( $scope.model.viewModel.backupRecord['formatted_'+property] ) )
                $scope.model.viewModel.formattedRecord[property] =
                  $scope.model.viewModel.backupRecord['formatted_'+property];
              $scope.patch( $scope.model.viewModel.record[property] );
            }
          };

          $scope.patch = function( property ) {
            // test the format
            if( !$scope.model.testFormat( property, $scope.model.viewModel.record[property] ) ) {
              var item = angular.element(
                angular.element( document.querySelector( '#' + property ) ) ).
                  scope().$parent.innerForm.name;
              item.$error.format = true;
              cenozo.updateFormElement( item );
            } else {
              // validation passed, proceed with patch
              var data = {};
              data[property] = $scope.model.viewModel.record[property];
              $scope.model.viewModel.onPatch( data ).then(
                function success() {
                  // if the data in the identifier was patched then reload with the new url
                  if( 0 <= $scope.model.viewModel.record.getIdentifier().split( /[;=]/ ).indexOf( property ) ) {
                    $scope.model.reloadState( $scope.model.viewModel.record );
                  } else {
                    var scope = angular.element(
                      angular.element( document.querySelector( '#' + property ) ) ).scope();
                    // if a conflict or format has been resolved then clear it throughout the form
                    var currentItem = scope.$parent.innerForm.name;
                    if( currentItem.$error.conflict ) {
                      var sibling = scope.$parent.$parent.$$childHead;
                      while( null !== sibling ) {
                        var siblingItem = sibling.$$childHead.$$nextSibling.$parent.innerForm.name;
                        if( siblingItem.$error.conflict ) {
                          siblingItem.$error.conflict = false;
                          cenozo.updateFormElement( siblingItem );
                        }
                        sibling = sibling.$$nextSibling;
                      }
                    }
                    if( currentItem.$error.format ) {
                      currentItem.$error.format = false;
                      cenozo.updateFormElement( currentItem );
                    }

                    // update the formatted value
                    $scope.model.viewModel.updateFormattedRecord( property );
                  }
                },
                function error( response ) {
                  if( 406 == response.status ) {
                    $scope.model.viewModel.record[property] = $scope.model.viewModel.backupRecord[property];
                    CnModalMessageFactory.instance( {
                      title: 'Please Note',
                      message: response.data,
                      error: true
                    } ).show();
                  } else if( 409 == response.status ) {
                    // report which inputs are included in the conflict
                    for( var i = 0; i < response.data.length; i++ ) {
                      var item = angular.element(
                        angular.element( document.querySelector( '#' + response.data[i] ) ) ).
                          scope().$parent.innerForm.name;
                      item.$error.conflict = true;
                      cenozo.updateFormElement( item );
                    }
                  } else { $scope.model.transitionToErrorState( response ); }
                }
              );
            }
          };

          $scope.getTypeaheadValues = function( input, viewValue ) {
            return $scope.model.getTypeaheadValues( input, viewValue );
          };

          $scope.onSelectTypeahead = function( input, $item, $model, $label ) {
            if( 'lookup-typeahead' == input.type ) {
              $scope.model.viewModel.formattedRecord[input.key] = $label;
              $scope.model.viewModel.record[input.key] = $model;
            } else {
              $scope.model.viewModel.record[input.key] = $item;
            }
            $scope.patch( input.key );
          };

          $scope.selectDatetime = function( input ) {
            CnModalDatetimeFactory.instance( {
              title: input.title,
              date: $scope.model.viewModel.record[input.key],
              pickerType: input.type
            } ).show().then( function( response ) {
              if( false !== response ) {
                $scope.model.viewModel.record[input.key] = response;
                $scope.patch( input.key );
              }
            } );
          };
        }
      },
      link: function( scope, element, attrs ) {
        scope.heading = attrs.heading;
        if( angular.isUndefined( scope.heading ) ) {
          var parentSubject = scope.model.getParentSubject();
          scope.heading = parentSubject ? parentSubject.ucWords() + ' ' : '';
          scope.heading += scope.model.name.singular.ucWords() + ' Details';
        }

        var recordLoaded = false;
        scope.inputArray = scope.model.getInputArray( scope.removeInputs );
        scope.$watch( 'model.viewModel.record', function( record ) {
          // convert datetimes
          if( angular.isDefined( record.id ) && !recordLoaded ) {
            recordLoaded = true;
            if( recordLoaded && metadataLoaded ) scope.isComplete = true;
          }
        } );

        // watch for changes in metadata (created asynchronously by the service)
        var metadataLoaded = false;
        scope.isComplete = false;
        scope.$watch( 'model.metadata', function( metadata ) {
          if( angular.isDefined( metadata ) &&
              angular.isDefined( metadata.columnList ) &&
              0 === metadata.loadingCount &&
              !metadataLoaded ) {
            // build enum lists
            for( var key in metadata.columnList ) {
              var input = scope.inputArray.findByProperty( 'key', key );
              if( input && 0 <= ['boolean', 'enum', 'rank'].indexOf( input.type ) ) {
                input.enumList = 'boolean' === input.type
                               ? [ { value: true, name: 'Yes' }, { value: false, name: 'No' } ]
                               : angular.copy( metadata.columnList[key].enumList );
                if( angular.isArray( input.enumList ) && !metadata.columnList[key].required )
                  input.enumList.unshift( { value: '', name: '(none)' } );
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

/* ######################################################################################################## */

/**
 * Site and role drop-downs which will switch the user's current role
 */
cenozo.directive( 'cnSiteRoleSwitcher', [
  '$window', 'CnAppSingleton',
  function( $window, CnAppSingleton ) {
    return {
      templateUrl: cenozo.baseUrl + '/app/cenozo/site-role-switcher.tpl.html',
      restrict: 'E',
      controller: function( $scope ) {
        $scope.setSite = function( id ) {
          if( id != CnAppSingleton.site.id ) {
            CnAppSingleton.setSite( id ).then( function() {
              // relist and set the url to the home state
              $window.location.assign( $window.location.pathname );
            } );
          }
        }

        $scope.setRole = function( id ) {
          if( id != CnAppSingleton.role.id ) {
            CnAppSingleton.setRole( id ).then( function() {
              // relist and set the url to the home state
              $window.location.assign( $window.location.pathname );
            } );
          }
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

/* ######################################################################################################## */

/**
 * Displays a group of buttons that provide various tools which may be used in any state.
 */
cenozo.directive( 'cnToolbelt', [
  'CnAppSingleton', 'CnModalTimezoneCalculatorFactory',
  function( CnAppSingleton, CnModalTimezoneCalculatorFactory ) {
    return {
      restrict: 'E',
      templateUrl: cenozo.baseUrl + '/app/cenozo/toolbelt.tpl.html',
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

/* ######################################################################################################## */

/**
 * TODO: document
 */
cenozo.filter( 'cnComparator', function() {
  return function( input ) {
    if( '<=>' == input ) return '=';
    if( '<>' == input ) return '\u2260';
    if( 'like' == input ) return '\u2248';
    if( 'not like' == input ) return '\u2249';
    if( '>' == input ) return input;
    if( '>=' == input ) return '\u2265';
    if( '<' == input ) return input;
    if( '<=' == input ) return '\u2264';
  };
} );

/* ######################################################################################################## */

/**
 * TODO: document
 */
cenozo.filter( 'cnCheckmark', function() {
  return function( input ) {
    if( "boolean" != typeof input ) input = 0 != input;
    return input ? '\u2714' : '\u2718';
  };
} );

/* ######################################################################################################## */

/**
 * TODO: document
 */
cenozo.filter( 'cnCrop', function() {
  return function( string, max ) {
    return max < string.length ? string.substring( 0, max-2 ) + '\u2026' : string;
  };
} );

/* ######################################################################################################## */

/**
 * TODO: document
 */
cenozo.filter( 'cnMetaFilter', [
  '$filter',
  function( $filter ) {
    return function( value, filterStr ) {
      if( angular.isDefined( filterStr ) && 0 < filterStr.length ) {
        // convert string into array deliminating by : (but not inside double quotes)
        var args = [].concat.apply( [], filterStr.split( '"' ).map(
          function( v, i ) {
            return i%2 ? v : v.split( ':' )
          }
        ) ).filter( Boolean );

        var filter = $filter( args.shift() );
        args.unshift( value );
        return filter.apply( null, args );
      } else {
        return angular.isUndefined( value ) || null === value ? '(none)' : value;
      }
    };
  }
] );

/* ######################################################################################################## */

/**
 * TODO: document
 */
cenozo.filter( 'cnMomentDate', [
  'CnAppSingleton',
  function( CnAppSingleton ) {
    return function( input, format ) {
      var output;
      if( angular.isUndefined( input ) || null === input ) {
        output = '(none)';
      } else {
        if( 'object' !== typeof input || angular.isUndefined( input.format ) ) input = moment( input );
        output = input.tz( CnAppSingleton.user.timezone ).format( format );
      }
      return output;
    };
  }
] );

/* ######################################################################################################## */

/**
 * TODO: document
 */
cenozo.filter( 'cnOrdinal', function() {
  return function( number ) {
    var postfixList = [ 'th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th' ];
    var modulo = number % 100;
    if( 11 <= modulo && modulo <= 13 ) return number + 'th';
    return number + postfixList[number % 10];
  }
} );

/* ######################################################################################################## */

/**
 * TODO: document
 */
cenozo.filter( 'cnPercent', function() {
  return function( input ) {
    return input + "%";
  };
} );

/* ######################################################################################################## */

/**
 * TODO: document
 */
cenozo.filter( 'cnUCWords', function() {
  return function( input ) {
    if( angular.isDefined( input ) )
      input = input.replace( /(?:^|\s)\S/g, function( a ) { return angular.uppercase( a ); } );
    return input;
  };
} );

/* ######################################################################################################## */

/**
 * TODO: document
 */
cenozo.filter( 'cnYesNo', function() {
  return function( input ) {
    if( "boolean" != typeof input ) input = 0 != input;
    return input ? 'yes' : 'no';
  };
} );

/* ######################################################################################################## */

/**
 * TODO: document
 */
cenozo.factory( 'CnAppSingleton', [
  '$state', 'CnHttpFactory',
  function( $state, CnHttpFactory ) {
    return new ( function() {
      var self = this;
      this.promise = null;
      this.application = {};
      this.user = {};
      this.site = {};
      this.role = {};
      this.siteList = [];
      this.messageList = [];

      // get the application, user, site and role details
      this.promise = CnHttpFactory.instance( {
        path: 'self/0'
      } ).get().then( function success( response ) {
        self.application = angular.copy( response.data.application );
        self.user = angular.copy( response.data.user );
        self.site = angular.copy( response.data.site );
        self.role = angular.copy( response.data.role );
        self.messageList = angular.copy( response.data.system_message_list );

        // process access records
        for( var i = 0; i < response.data.access.length; i++ ) {
          var access = response.data.access[i];

          // get the site's index
          var index = 0;
          for( ; index < self.siteList.length; index++ )
            if( access.site_id == self.siteList[index].id ) break;

          // if the site isn't found, add it to the list
          if( self.siteList.length == index )
            self.siteList.push( { id: access.site_id, name: access.site_name, roleList: [] } );

          // now add the role to the site's role list
          self.siteList[index].roleList.push( {
            id: access.role_id,
            name: access.role_name
          } );
        }
      } ).catch( function exception( response ) {
        var type = angular.isDefined( response ) || angular.isDefined( response.status )
                 ? response.status : 500;
        $state.go( 'error.' + type );
      } );

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

      this.setTimezone = function setTimezone( timezone ) {
        return CnHttpFactory.instance( {
          path: 'self/0',
          data: { user: { timezone: timezone } }
        } ).patch();
      };
    } );
  }
] );

/* ######################################################################################################## */

/**
 * TODO: document
 */
cenozo.factory( 'CnBaseAddFactory', [
  'CnHttpFactory',
  function( CnHttpFactory ) {
    return {
      construct: function( object, parentModel ) {
        object.parentModel = parentModel;

        /**
         * Must be called by the onAdd() function in order to send the new record to the server.
         * This function should not be changed, override the onAdd() function instead.
         * 
         * @param object record: The record to add
         * @return promise
         */
        object.addRecord = function( record ) {
          if( !this.parentModel.addEnabled ) throw 'Calling addRecord() but addEnabled is false';
          return CnHttpFactory.instance( {
            path: this.parentModel.getServiceCollectionPath(),
            data: record
          } ).post();
        };

        /**
         * Must be called by the onNew() function in order to create a new local record.
         * This function should not be changed, override the onNew() function instead.
         * 
         * @param object record: The object to initialize as a new record
         * @return promise
         */
        object.newRecord = function( record ) {
          var self = this;
          if( !this.parentModel.addEnabled ) throw 'Calling newRecord() but addEnabled is false';

          // load the metadata and use it to apply default values to the record
          this.parentModel.metadata.loadingCount++;
          return this.parentModel.getMetadata().then( function() {
            // apply default values from the metadata
            for( var column in self.parentModel.metadata.columnList )
              if( null !== self.parentModel.metadata.columnList[column].default )
                record[column] = 'tinyint' == self.parentModel.metadata.columnList[column].data_type
                               ? 1 == self.parentModel.metadata.columnList[column].default
                               : self.parentModel.metadata.columnList[column].default;

            // signal that we are done loading metadata
            self.parentModel.metadata.loadingCount--;
          } );
        };

        /**
         * Override this function when needing to make additional operations when adding or creating
         * this model's records.
         * 
         * @return promise
         */
        object.onAdd = function( record ) { return this.addRecord( record ); };
        object.onNew = function( record ) { return this.newRecord( record ); };
      }
    };
  }
] );

/* ######################################################################################################## */

/**
 * TODO: document
 */
cenozo.factory( 'CnBaseListFactory', [
  'CnPaginationFactory', 'CnHttpFactory',
  function( CnPaginationFactory, CnHttpFactory ) {
    return {
      construct: function( object, parentModel ) {
        object.parentModel = parentModel;
        object.order = object.parentModel.defaultOrder;
        object.total = 0;
        object.cache = [];
        object.paginationFactory = CnPaginationFactory.instance();
        object.isLoading = false;

        object.orderBy = function( column ) {
          if( null === this.order || column != this.order.column ) {
            this.order = { column: column, reverse: false };
          } else {
            this.order.reverse = !this.order.reverse;
          }
          if( this.cache.length < this.total ) this.listRecords( true );
          this.paginationFactory.currentPage = 1;
        };

        object.restrict = function( column, restrict ) {
          var columnList = this.parentModel.columnList;
          if( angular.isUndefined( restrict ) ) {
            if( angular.isDefined( columnList[column].restrict ) ) delete columnList[column].restrict;
          } else {
            columnList[column].restrict = restrict;
          }
          this.listRecords( true );
          this.paginationFactory.currentPage = 1;
        };

        object.checkCache = function() {
          var self = this;
          if( this.cache.length < this.total && this.paginationFactory.getMaxIndex() >= this.cache.length )
            this.listRecords().catch( function exception( response ) {
              self.parentModel.transitionToErrorState( response );
            } );
        };

        /**
         * Must be called by the onChoose() function in order to add a record on the server in a
         * many-to-many relationship.
         * This function should not be changed, override the onChoose() function instead.
         * 
         * @param object record: The record to choose
         * @return promise
         */
        object.chooseRecord = function( record ) {
          if( !this.parentModel.chooseEnabled ) throw 'Calling chooseRecord() but chooseEnabled is false';

          // note: don't use the record's getIdentifier since choosing requires the ID only
          return record.chosen ?
            CnHttpFactory.instance( {
              path: this.parentModel.getServiceResourcePath( record.id )
            } ).delete().then( function success() { record.chosen = 0; } ) :
            CnHttpFactory.instance( {
              path: this.parentModel.getServiceCollectionPath(), data: record.id
            } ).post().then( function success() { record.chosen = 1; } );
        };

        /**
         * Must be called by the onDelete() function in order to delete a record from the server.
         * This function should not be changed, override the onDelete() function instead.
         * 
         * @param object record: The record to delete
         * @return promise
         */
        object.deleteRecord = function( record ) {
          var self = this;
          if( !this.parentModel.deleteEnabled ) throw 'Calling deleteRecord() but deleteEnabled is false';

          return CnHttpFactory.instance( {
            path: this.parentModel.getServiceResourcePath( record.getIdentifier() ),
          } ).delete().then( function success() {
            for( var i = 0; i < self.cache.length; i++ ) {
              if( self.cache[i].getIdentifier() == record.getIdentifier() ) {
                self.total--;
                return self.cache.splice( i, 1 );
              }
            }
          } );
        };

        /**
         * Must be called by the onList() function in order to load records from the server.
         * This function should not be changed, override the onList() function instead.
         * 
         * @param boolean replace: Whether to replace the cached list or append to it
         * @return promise
         */
        object.listRecords = function( replace ) {
          var self = this;
          if( angular.isUndefined( replace ) ) replace = false;
          if( replace ) this.cache = [];

          var data = this.parentModel.getServiceData( 'list' );
          if( angular.isUndefined( data.modifier ) ) data.modifier = {};
          data.modifier.offset = replace ? 0 : this.cache.length;
          if( parentModel.chooseEnabled && this.chooseMode ) data.choosing = 1;

          // set up the offset and sorting
          if( null !== this.order ) {
            // add the table prefix to the column if there isn't already a prefix
            var column = this.order.column;
            data.modifier.order = {};
            data.modifier.order[column] = this.order.reverse;
          }

          this.isLoading = true;
          return CnHttpFactory.instance( {
            path: this.parentModel.getServiceCollectionPath(),
            data: data
          } ).query().then( function success( response ) {
            // add the getIdentifier() method to each row before adding it to the cache
            for( var i = 0; i < response.data.length; i++ ) {
              response.data[i].getIdentifier = function() {
                return self.parentModel.getIdentifierFromRecord( this );
              };
            }
            self.cache = self.cache.concat( response.data );
            self.total = response.headers( 'Total' );
          } ).then( function done() {
            self.isLoading = false;
          } );
        };

        object.chooseMode = false;
        object.toggleChooseMode = function() {
          this.chooseMode = !this.chooseMode;
          this.listRecords( true );
        };

        /**
         * Override these function when needing to make additional operations when choosing, deleting
         * or listing this model's records.
         * 
         * @return promise
         */
        object.onChoose = function( record ) { return this.chooseRecord( record ); };
        object.onDelete = function( record ) { return this.deleteRecord( record ); };
        object.onList = function( replace ) { return this.listRecords( replace ); };
      }
    };
  }
] );

/* ######################################################################################################## */

/**
 * TODO: document
 */
cenozo.factory( 'CnBaseViewFactory', [
  'CnHttpFactory',
  function( CnHttpFactory ) {
    return {
      construct: function( object, parentModel ) {
        object.parentModel = parentModel;
        object.record = {};
        object.formattedRecord = {};
        object.backupRecord = {};

        /**
         * Updates a property of the formatted copy of the record
         */
        object.updateFormattedRecord = function( property ) {
          if( angular.isDefined( property ) ) {
            var input = this.parentModel.inputList[property];
            if( angular.isDefined( input ) ) {
              if( angular.isDefined( 'lookup-typeahead' == input.type ) ) {
                // When lookup-typeaheads are first loaded move the formatted property from the record
                // to the formatted record.  We must do this so that future calls to this function do
                // not overrite the formatted typeahead property (the onSelectTypeahead callback is
                // responsible for that)
                if( angular.isDefined( this.record['formatted_'+property] ) ) {
                  this.formattedRecord[property] = this.record['formatted_'+property];
                  delete this.record['formatted_'+property];
                }
              } else {
                this.formattedRecord[property] =
                  this.parentModel.formatValue( property, this.record[property] );
              }
            }
          } else {
            // update all properties
            for( var property in this.record ) this.updateFormattedRecord( property );
          }
        };

        /**
         * Must be called by the onDelete() function in order to delete the viewed record from the server.
         * This function should not be changed, override the onDelete() function instead.
         * 
         * @return promise
         */
        object.deleteRecord = function() {
          if( !this.parentModel.deleteEnabled ) throw 'Calling deleteRecord() but deleteEnabled is false';

          return CnHttpFactory.instance( {
            path: this.parentModel.getServiceResourcePath()
          } ).delete();
        };

        /**
         * Must be called by the onPatch() function in order to make changes on the server to the viewed record.
         * This function should not be changed, override the onPatch() function instead.
         * 
         * @param object data: An object of column -> value pairs to change
         * @return promise
         */
        object.patchRecord = function( data ) {
          if( !this.parentModel.editEnabled ) throw 'Calling patchRecord() but editEnabled is false';

          return CnHttpFactory.instance( {
            path: this.parentModel.getServiceResourcePath(),
            data: data
          } ).patch();
        };

        /**
         * Must be called by the onView() function in order to load data from the server to view the record.
         * This function should not be changed, override the onView() function instead.
         * 
         * @return promise
         */
        object.viewRecord = function() {
          var self = this;
          if( !this.parentModel.viewEnabled ) throw 'Calling viewRecord() but viewEnabled is false';

          return CnHttpFactory.instance( {
            path: this.parentModel.getServiceResourcePath(),
            data: this.parentModel.getServiceData( 'view' )
          } ).get().then( function success( response ) {
            // create the record
            self.record = angular.copy( response.data );
            self.record.getIdentifier = function() {
              return self.parentModel.getIdentifierFromRecord( this );
            };

            // create the backup record
            self.backupRecord = angular.copy( self.record );

            self.parentModel.metadata.loadingCount++;

            return self.parentModel.getMetadata().then( function() {
              // convert blank enums into empty strings (for ng-options)
              for( var column in self.parentModel.inputList ) {
                var inputObject = self.parentModel.inputList[column];
                if( 'enum' == inputObject.type && null === self.record[column] ) {
                  var metadata = self.parentModel.metadata.columnList[column];
                  if( angular.isDefined( metadata ) && !metadata.required ) {
                    self.record[column] = '';
                    self.backupRecord[column] = '';
                  }
                }
              }

              // update all properties in the formatted record
              self.updateFormattedRecord();

              // signal that we are done loading metadata
              self.parentModel.metadata.loadingCount--;
            } );
          } );
        };

        /**
         * Override these function when needing to make additional operations when deleting, patching
         * or viewing this model's records.
         * 
         * @return promise
         */
        object.onDelete = function() { return this.deleteRecord(); };
        object.onPatch = function( data ) { return this.patchRecord( data ); };
        object.onView = function() { return this.viewRecord(); };
      }
    };
  }
] );

/* ######################################################################################################## */

/**
 * TODO: document
 */
cenozo.factory( 'CnBaseModelFactory', [
  '$state', '$stateParams', 'CnAppSingleton', 'CnHttpFactory',
  function( $state, $stateParams, CnAppSingleton, CnHttpFactory ) {
    return {
      construct: function( object, module ) {
        for( var property in module ) object[property] = angular.copy( module[property] );

        object.metadata = { loadingCount: 0 };
        object.addEnabled = false;
        object.chooseEnabled = false;
        object.deleteEnabled = false;
        object.editEnabled = false;
        object.viewEnabled = false;

        // search the state enumeration for which actions are available
        var stateList = $state.get();
        for( var i = 0; i < stateList.length; i++ ) {
          if( module.subject + '.add' == stateList[i].name ) object.addEnabled = true;
          if( module.subject + '.delete' == stateList[i].name ) object.deleteEnabled = true;
          if( module.subject + '.view' == stateList[i].name ) object.viewEnabled = true;
          if( module.subject + '.edit' == stateList[i].name ) object.editEnabled = true;
        }

        // override this method to use a custom identifier
        object.getIdentifierFromRecord = function( record ) { return String( record.id ); };

        // returns an object containing a subject => identifier pair
        object.getParentIdentifierObject = function() {
          var stateNameParts = $state.current.name.split( '.' );
          var len = stateNameParts.length;
          if( 2 > len ) throw 'State "' + $state.current.name + '" is expected to have at least 2 parts';

          var identifierObject = {};
          if( stateNameParts[len-2] != this.subject ) {
            var parentSubject = stateNameParts[len-2];
            var parentIdentifier = angular.isDefined( $stateParams.parentIdentifier )
                                 ? $stateParams.parentIdentifier
                                 : $stateParams.identifier;
            identifierObject[parentSubject] = parentIdentifier;
          }

          return identifierObject;
        };

        object.getParentSubject = function() {
          var subjectList = Object.keys( this.getParentIdentifierObject() );
          return 0 < subjectList.length ? subjectList[0] : null;
        };

        // Helper functions to get service paths and data
        object.getServiceCollectionPath = function() {
          var path = '';
          var parentIdentifier = this.getParentIdentifierObject();
          for( var property in parentIdentifier ) path += property + '/' + parentIdentifier[property] + '/';
          return path + module.subject;
        }
        object.getServiceResourcePath = function( resource ) {
          var identifier = angular.isUndefined( resource ) ? $stateParams.identifier : resource;
          return this.getServiceCollectionPath() + '/' + identifier;
        }
        object.getServiceData = function( type ) {
          if( angular.isUndefined( type ) || 0 > ['list','view'].indexOf( type ) )
            throw 'getServiceData requires one argument which is either "list" or "view"';

          // set up the select, join and where list based on the column list
          var selectList = [];
          var joinList = [];
          var whereList = [];
          var list = 'list' == type ? this.columnList : this.inputList;
          for( var key in list ) {
            var lastJoin = null;
            var parentTable = this.subject;
            var columnParts = angular.isUndefined( list[key].column ) ? [ key ] : list[key].column.split( '.' );
            for( var k = 0; k < columnParts.length; k++ ) {
              if( k == columnParts.length - 1 ) {
                if( 'months' == list[key].type ) {
                  for( var month = 0; month < 12; month++ )
                    selectList.push( angular.lowercase( moment().month( month ).format( 'MMMM' ) ) );
                } else {
                  // add this column to the select list
                  var select = { column: columnParts[k], alias: key };
                  if( 0 < k ) select.table = columnParts[k-1];
                  else select.table_prefix = false;
                  selectList.push( select );
                }
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

            // make sure the identifier's column is also selected
            this.getIdentifierFromRecord( {} ).split( ';' ).forEach( function( value ) {
              if( 0 <= value.indexOf( '=' ) ) selectList.push( value.split( '=' )[0] );
            } );

            if( angular.isDefined( list[key].restrict ) && null !== list[key].restrict ) {
              var test = list[key].restrict.test;
              var value = list[key].restrict.value;
              if( 'like' == test || 'not like' == test ) value = '%' + value + '%';

              // determine the column name
              var column = key;
              if( angular.isDefined( list[key].column ) ) {
                var columnParts = list[key].column.split( '.' );
                var len = columnParts.length;
                column = list[key].column;
                if( 2 < len ) column = columnParts[len-2] + '.' + columnParts[len-1];
              }

              whereList.push( {
                column: column,
                operator: test,
                value: value
              } );
            }
          }

          var data = {};
          if( 0 < selectList.length ) data.select = { column: selectList };
          if( 0 < joinList.length || 0 < whereList.length ) {
            data.modifier = {};
            if( 0 < joinList.length ) data.modifier.join = joinList;
            if( 0 < whereList.length ) data.modifier.where = whereList;
          }
          return data;
        }

        // helper functions based on the state
        object.reloadState = function( record ) {
          if( angular.isUndefined( record ) ) {
            $state.reload();
          } else {
            $stateParams.identifier = record.getIdentifier();
            $state.transitionTo( $state.current, $stateParams, { reload: true } );
          }
        };
        object.transitionToLastState = function() {
          var stateName = $state.current.name;
          var action = stateName.substring( stateName.lastIndexOf( '.' ) + 1 );
          if( 'add' == action || 'view' == action ) {
            $state.go( '^.list' );
          } else { // sub-view, return to parent view
            $state.go( '^.view', { identifier: $stateParams.parentIdentifier } );
          }
        };
        object.transitionToAddState = function() {
          var stateName = $state.current.name;
          if( 'view' == stateName.substring( stateName.lastIndexOf( '.' ) + 1 ) ) {
            $state.go( '^.add_' + this.subject, { parentIdentifier: $stateParams.identifier } );
          } else { // adding to a view state
            $state.go( '^.add' );
          }
        };
        object.transitionToViewState = function( record ) {
          var stateName = $state.current.name;
          if( 'view' == stateName.substring( stateName.lastIndexOf( '.' ) + 1 ) ) {
            $state.go( '^.view_' + this.subject, {
              parentIdentifier: $stateParams.identifier, identifier: record.getIdentifier()
            } );
          } else {
            $state.go( this.subject + '.view', { identifier: record.getIdentifier() } );
          }
        };
        object.transitionToErrorState = function( response ) {
          var type = angular.isDefined( response ) && angular.isDefined( response.status )
                   ? response.status : 500;
          $state.go( 'error.' + type );
        };

        /**
         * Makes an array containing COPIES of the model's input list
         */
        object.getInputArray = function( removeInputList ) {
          if( angular.isUndefined( removeInputList ) ) removeInputList = [];

          // make a copy of the input list and remove any parent column(s)
          var inputObjectList = angular.copy( this.inputList );
          for( var property in this.getParentIdentifierObject() ) delete inputObjectList[property+'_id'];

          // create an array out of the input list
          var inputArray = [];
          for( var key in inputObjectList ) {
            if( 0 > removeInputList.indexOf( key ) ) {
              var input = inputObjectList[key];
              input.key = key;
              inputArray.push( input );
            }
          }
          return inputArray;
        };

        /**
         * Makes an array containing REFERENCES to the model's column list
         */
        object.getColumnArray = function( removeColumnList ) {
          if( angular.isUndefined( removeColumnList ) ) removeColumnList = [];

          // create an array out of the column list
          var columnArray = [];
          for( var key in this.columnList ) {
            if( 0 > removeColumnList.indexOf( key ) ) {
              var column = this.columnList[key];
              if( angular.isUndefined( column.allowRestrict ) ) column.allowRestrict = true;
              column.key = key;
              columnArray.push( column );
            }
          }
          return columnArray;
        };

        /**
         * Returns an array of possible values for typeahead inputs
         */
        object.getTypeaheadValues = function( input, viewValue ) {
          // sanity checking
          if( angular.isUndefined( input ) )
            throw 'Typeahead used without a valid input key (' + key + ').';
          if( 0 > ['typeahead','lookup-typeahead'].indexOf( input.type ) )
            throw 'Tried getting typeahead values for input of type "' + input.type + '"';
          if( 'typeahead' == input.type ) {
            if( !angular.isArray( input.typeahead ) )
              throw 'Typeaheads require the input list\'s "typeahead" property to be an array';
          } else if ( 'lookup-typeahead' == input.type ) {
            if( !angular.isObject( input.typeahead ) )
              throw 'Lookup-typeaheads require the input list\'s "typeahead" property to be an object';
          } else {
            throw 'Tried getting typeahead values for input of type "' + input.type + '"';
          }

          if( 'typeahead' == input.type ) {
            var re = new RegExp( angular.lowercase( viewValue ) );
            return input.typeahead.filter( function( value ) { return re.test( angular.lowercase( value ) ); } );
          } else { // 'lookup-typeahead' == input.type
            // make note that we are loading the typeahead values
            input.typeahead.isLoading = true;

            // create the where statement
            var where = {};
            if( angular.isUndefined( input.typeahead.where ) ) {
              where = {
                column: angular.isUndefined( input.typeahead.select ) ? 'name' : input.select,
                operator: 'like',
                value: viewValue + '%'
              };
            } else {
              where = [];
              var whereList = angular.isArray( input.typeahead.where )
                            ? input.typeahead.where
                            : [ input.typeahead.where ];
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
              path: input.typeahead.table,
              data: {
                select: {
                  column: [
                    'id',
                    {
                      column: angular.isUndefined( input.typeahead.select ) ? 'name' : input.typeahead.select,
                      alias: 'value',
                      table_prefix: false
                    }
                  ]
                },
                modifier: { where: where }
              }
            } ).get().then( function( response ) {
              input.typeahead.isLoading = false;
              return angular.copy( response.data );
            } );
          }
        };

        // enable/disable module functionality
        object.enableAdd = function( enable ) { this.addEnabled = enable; };
        object.enableChoose = function( enable ) { this.chooseEnabled = enable; };
        object.enableDelete = function( enable ) { this.deleteEnabled = enable; };
        object.enableEdit = function( enable ) { this.editEnabled = enable; };
        object.enableView = function( enable ) { this.viewEnabled = enable; };

        /**
         * Must be called by the getMetadata() function in order to load this model's base metadata
         * This function should not be changed, override the getMetadata() function instead.
         * 
         * @return promise
         */
        object.loadMetadata = function() {
          var self = this;
          this.metadata.columnList = {};
          this.metadata.isComplete = false;
          this.metadata.loadingCount++;
          return CnHttpFactory.instance( {
            path: this.subject
          } ).head().then( function( response ) {
            var columnList = angular.fromJson( response.headers( 'Columns' ) );
            for( var column in columnList ) {
              columnList[column].required = '1' == columnList[column].required;
              if( 'enum' == columnList[column].data_type ) { // parse out the enum values
                columnList[column].enumList = [];
                var enumList = columnList[column].type.replace( /^enum\(['"]/i, '' )
                                                    .replace( /['"]\)$/, '' )
                                                    .split( "','" );
                for( var i = 0; i < enumList.length; i++ ) {
                  columnList[column].enumList.push( {
                    value: enumList[i],
                    name: enumList[i]
                  } );
                }
              }
            }
            self.metadata.columnList = columnList;

            if( angular.isDefined( self.metadata.columnList.rank ) ) { // create enum for rank columns
              self.metadata.loadingCount++;
              CnHttpFactory.instance( {
                path: self.getServiceCollectionPath(),
                data: { select: { column: { column: 'MAX(rank)', alias: 'max', table_prefix: false } } }
              } ).query().then( function success( response ) {
                if( 0 < response.data.length ) {
                  self.metadata.columnList.rank.enumList = [];
                  if( null !== response.data[0].max )
                    for( var rank = 1; rank <= parseInt( response.data[0].max ); rank++ )
                      self.metadata.columnList.rank.enumList.push( { value: rank, name: rank } );
                }
                // signal that we are done loading metadata
                self.metadata.loadingCount--;
              } );
            }
            self.metadata.loadingCount--;
          } );
        };

        /**
         * Override this function when additional metadata is required by the model.
         * 
         * @return promise
         */
        object.getMetadata = function() { return this.loadMetadata(); };

        /**
         * Applies special formatting to a record's value
         */
        object.formatValue = function formatValue( property, value ) {
          var formatted = value;
          if( null !== value ) {
            var input = this.inputList[property];
            if( input ) {
              if( 0 <= ['datetimesecond','datetime','date','timesecond','time'].indexOf( input.type ) ) {
                var obj = moment( value );
                if( 'datetimesecond' == input.type || 'datetime' == input.type ) {
                  obj.tz( CnAppSingleton.user.timezone );
                  if( 'datetimesecond' == input.type ) formatted = obj.format( 'YYYY-MM-DD HH:mm:ss' );
                  else /*if( 'datetime' == input.type )*/ formatted = obj.format( 'YYYY-MM-DD HH:mm' );
                } else {
                  if( 'date' == input.type ) formatted = obj.format( 'YYYY-MM-DD' );
                  else if( 'timesecond' == input.type ) formatted = obj.format( 'HH:mm:ss' );
                  else /*if( 'time' == input.type )*/ formatted = obj.format( 'HH:mm' );
                }
              }
            }
          }
          console.log( [property, value, formatted] );
          return formatted;
        };

        /**
         * Determines whether a value meets its property's format
         */
        object.testFormat = function( property, value ) {
          var input = this.inputList[property];
          if( angular.isUndefined( input ) ) return true;

          // check format
          if( angular.isDefined( input.format ) ) {
            // determine the regex
            var re = undefined;
            if( 'integer' == input.format ) re = /^-?[0-9]+$/;
            else if( 'float' == input.format ) re = /^-?(([0-9]+\.?)|([0-9]*\.[0-9]+))$/;
            else if( 'alphanum' == input.format ) re = /^[a-zA-Z0-9]+$/;
            else if( 'alpha_num' == input.format ) re = /^[a-zA-Z0-9_]+$/;
            else if( 'email' == input.format ) re = /^[^ ,]+@[^ ,]+\.[^ ,]+$/;

            // test the regex, min and max values
            if( angular.isDefined( re ) && !re.test( value ) ) return false;
            if( angular.isDefined( input.minValue ) && input.minValue > value ) return false;
            if( angular.isDefined( input.maxValue ) && input.maxValue < value ) return false;
          }

          // check regex (note: escape character "\" must by typed FOUR times: \\\\
          if( angular.isDefined( input.regex ) ) {
            var re = new RegExp( input.regex );
            if( !re.test( value ) ) return false;
          }

          // if we get here then the format is okay
          return true;
        };
      }
    };
  }
] );

/* ######################################################################################################## */

/**
 * TODO: document
 */
cenozo.factory( 'CnHttpFactory', [
  '$http',
  function CnHttpFactory( $http ) {
    var object = function( params ) {
      if( angular.isUndefined( params.path ) ) throw 'Tried to create CnHttpFactory without a path';
      this.path = null;
      this.data = {};
      angular.extend( this, params );

      this.http = function( method, url ) {
        var object = { url: url, method: method };
        if( null != this.data ) {
          if( 'POST' == method || 'PATCH' == method ) object.data = this.data;
          else object.params = this.data;
        }
        return $http( object );
      };

      this.delete = function() { return this.http( 'DELETE', 'api/' + this.path ); };
      this.get = function() { return this.http( 'GET', 'api/' + this.path ); };
      this.head = function() { return this.http( 'HEAD', 'api/' + this.path ); };
      this.patch = function() { return this.http( 'PATCH', 'api/' + this.path ); };
      this.post = function() { return this.http( 'POST', 'api/' + this.path ); };
      this.query = function() { return this.http( 'GET', 'api/' + this.path ); };
    };

    return { instance: function( params ) { return new object( angular.isUndefined( params ) ? {} : params ); } };
  }
] );

/* ######################################################################################################## */

/**
 * TODO: document
 */
cenozo.service( 'CnModalConfirmFactory', [
  '$modal',
  function( $modal ) {
    var object = function( params ) {
      var self = this;
      this.title = 'Title';
      this.message = 'Message';
      angular.extend( this, params );

      this.show = function() {
        return $modal.open( {
          backdrop: 'static',
          keyboard: true,
          modalFade: true,
          templateUrl: cenozo.baseUrl + '/app/cenozo/modal-confirm.tpl.html',
          controller: function( $scope, $modalInstance ) {
            $scope.local = self;
            $scope.local.yes = function() { $modalInstance.close( true ); };
            $scope.local.no = function() { $modalInstance.close( false ); };
          }
        } ).result;
      };
    };

    return { instance: function( params ) { return new object( angular.isUndefined( params ) ? {} : params ); } };
  }
] );

/* ######################################################################################################## */

/**
 * TODO: document
 */
cenozo.service( 'CnModalDatetimeFactory', [
  '$modal', '$window', 'CnAppSingleton',
  function( $modal, $window, CnAppSingleton ) {
    var object = function( params ) {
      var self = this;

      var viewMoveGaps = {
        day: { unit: 'months', amount: 1 },
        month: { unit: 'years', amount: 1 },
        year: { unit: 'years', amount: 20 },
      };

      function split( array, size ) {
        var subArrays = [];
        while( 0 < array.length ) subArrays.push( array.splice( 0, size ) );
        return subArrays;
      }

      // service vars which can be defined by the contructor's params
      this.timezone = null;
      this.date = null;
      this.viewingDate = null;
      this.title = 'Title';
      this.pickerType = 'datetime';
      this.mode = 'day';
      angular.extend( this, params );

      // service vars which cannot be defined by the constructor's params
      if( null === this.timezone ) this.timezone = CnAppSingleton.user.timezone;
      if( null === this.date ) {
        this.viewingDate = moment();
      } else {
        this.date = moment( this.date );
        if( 'datetime' == this.pickerType || 'datetimesecond' == this.pickerType ) this.date.tz( this.timezone );
        this.viewingDate = moment( this.date );
      }
      this.modeTitle = '';
      this.displayTime = '';
      this.hourSliderValue = this.viewingDate.format( 'H' );
      this.minuteSliderValue = this.viewingDate.format( 'm' );
      this.secondSliderValue = this.viewingDate.format( 's' );

      this.prevMode = function() {
        this.mode = 'year' == this.mode ? 'month' : 'day';
        this.update();
      };
      this.nextMode = function() {
        this.mode = 'day' == this.mode ? 'month' : 'year';
        this.update();
      };
      this.viewPrev = function() {
        var gap = viewMoveGaps[this.mode];
        this.viewingDate.subtract( gap.amount, gap.unit );
        this.update();
      };
      this.viewNext = function() {
        var gap = viewMoveGaps[this.mode];
        this.viewingDate.add( gap.amount, gap.unit );
        this.update();
      };
      this.select = function( when ) {
        if( 'now' == when ) {
          this.date = moment().tz( CnAppSingleton.user.timezone );
        } else if( 'today' == when ) {
          this.date.year( moment().year() ).month( moment().month() ).date( moment().date() );
        } else {
          this.date.year( when.year() ).month( when.month() ).date( when.date() );
        }

        if( null !== this.date ) this.viewingDate = moment( this.date );
        this.prevMode(); // will call update()
      };
      this.updateDisplayTime = function() {
        var format = 'datetimesecond' == this.pickerType || 'timesecond' == this.pickerType
                   ? 'HH:mm:ss'
                   : 'HH:mm';
        this.displayTime = this.date.format( format ) + ' (' + this.timezone + ')';
      };
      this.update = function() {
        if( 'day' == this.mode ) {
          this.modeTitle = this.viewingDate.format( 'MMMM YYYY' );
          var cellList = [];

          // get forward dates
          var date = moment( this.viewingDate );
          date.hour( 12 ).minute( 0 ).second( 0 );
          for( ; date.month() == this.viewingDate.month() || 0 < date.day(); date.add( 1, 'days' ) ) {
            var cellDate = moment( date );
            cellList.push( {
              date: cellDate,
              label: cellDate.format( 'DD' ),
              current: null !== this.date &&
                       this.date.isSame( cellDate, 'year' ) &&
                       this.date.isSame( cellDate, 'month' ) &&
                       this.date.isSame( cellDate, 'day' ),
              offMonth: !this.viewingDate.isSame( cellDate, 'month' ),
              weekend: 0 <= [0,6].indexOf( cellDate.day() ),
              disabled: false
            } );
          }

          // get backward dates
          var date = moment( this.viewingDate ).subtract( 1, 'days' );
          date.hour( 12 ).minute( 0 ).second( 0 );
          for( ; date.month() == this.viewingDate.month() || 6 > date.day(); date.subtract( 1, 'days' ) ) {
            var cellDate = moment( date );
            cellList.unshift( {
              date: cellDate,
              label: cellDate.format( 'DD' ),
              current: null !== this.date &&
                       this.date.isSame( cellDate, 'year' ) &&
                       this.date.isSame( cellDate, 'month' ) &&
                       this.date.isSame( cellDate, 'day' ),
              offMonth: !this.viewingDate.isSame( cellDate, 'month' ),
              weekend: 0 <= [0,6].indexOf( cellDate.day() ),
              disabled: false
            } );
          }

          this.cellList = split( cellList, 7 );
        } else if( 'month' == this.mode ) {
          this.modeTitle = this.viewingDate.format( 'YYYY' );
          var cellList = [];

          // one date per month
          var date = moment( this.viewingDate );
          for( var month = 0; month < 12; month++ ) {
            date.month( month );
            var cellDate = moment( date );
            cellList.push( {
              date: cellDate,
              label: cellDate.format( 'MMMM' ),
              current: null !== this.date &&
                       this.date.isSame( cellDate, 'year' ) &&
                       this.date.isSame( cellDate, 'month' ),
              offMonth: false,
              weekend: false,
              disabled: false
            } );
          }

          this.cellList = split( cellList, 3 );
        } else { // 'year' == this.mode
          var lowerYear = Math.floor( this.viewingDate.year() / 20 ) * 20;
          var upperYear = lowerYear + 20 - 1;
          this.modeTitle = lowerYear + ' - ' + upperYear;
          var cellList = [];

          // one date per year
          var date = moment( this.viewingDate );
          for( var year = lowerYear; year <= upperYear; year++ ) {
            date.year( year );
            var cellDate = moment( date );
            cellList.push( {
              date: cellDate,
              label: cellDate.format( 'YYYY' ),
              current: null !== this.date &&
                       this.date.isSame( cellDate, 'year' ),
              offMonth: false,
              weekend: false,
              disabled: false
            } );
          }

          this.cellList = split( cellList, 5 );
        }

        this.updateDisplayTime();

        // need to send a resize event so the sliders update
        $window.dispatchEvent( new Event( 'resize' ) );
      };

      this.show = function() {
        return $modal.open( {
          backdrop: 'static',
          keyboard: true,
          modalFade: true,
          templateUrl: cenozo.baseUrl + '/app/cenozo/modal-datetime.tpl.html',
          controller: function( $scope, $modalInstance ) {
            $scope.local = self;
            $scope.local.ok = function() {
              $modalInstance.close( null === $scope.local.date ? null : $scope.local.date.tz( 'utc' ).format() );
            };
            $scope.local.cancel = function() { $modalInstance.close( false ); };

            $scope.$watch( 'local.hourSliderValue', function( hour ) {
              $scope.local.date.hour( hour );
              $scope.local.updateDisplayTime();
            } );
            $scope.$watch( 'local.minuteSliderValue', function( minute ) {
              $scope.local.date.minute( minute );
              $scope.local.updateDisplayTime();
            } );
            $scope.$watch( 'local.secondSliderValue', function( second ) {
              $scope.local.date.second( second );
              $scope.local.updateDisplayTime();
            } );
          }
        } ).result;
      };

      this.update();
    };

    return { instance: function( params ) { return new object( angular.isUndefined( params ) ? {} : params ); } };
  }
] );

/* ######################################################################################################## */

/**
 * TODO: document
 */
cenozo.service( 'CnModalMessageFactory', [
  '$modal',
  function( $modal ) {
    var object = function( params ) {
      var self = this;
      this.title = 'Title';
      this.message = 'Message';
      this.error = false;
      angular.extend( this, params );

      this.show = function() {
        return $modal.open( {
          backdrop: 'static',
          keyboard: true,
          modalFade: true,
          templateUrl: cenozo.baseUrl + '/app/cenozo/modal-message.tpl.html',
          controller: function( $scope, $modalInstance ) {
            $scope.local = self;
            $scope.local.close = function() { $modalInstance.close( false ); };
          }
        } ).result;
      };
    };

    return { instance: function( params ) { return new object( angular.isUndefined( params ) ? {} : params ); } };
  }
] );

/* ######################################################################################################## */

/**
 * TODO: document
 */
cenozo.service( 'CnModalRestrictFactory', [
  '$modal',
  function( $modal ) {
    var object = function( params ) {
      var self = this;
      if( angular.isUndefined( params.column ) ) throw 'Tried to create CnModalRestrictFactory without a column';
      this.name = null;
      this.column = null;
      this.comparison = null;
      angular.extend( this, params );

      if( angular.isUndefined( this.comparison ) || null === this.comparison ) this.comparison = { test: '<=>' };
      this.preExisting = angular.isDefined( this.comparison.value );
      this.show = function() {
        return $modal.open( {
          backdrop: 'static',
          keyboard: true,
          modalFade: true,
          templateUrl: cenozo.baseUrl + '/app/cenozo/modal-restrict.tpl.html',
          controller: function( $scope, $modalInstance ) {
            $scope.local = self;
            $scope.local.ok = function( comparison ) { $modalInstance.close( comparison ); };
            $scope.local.remove = function() { $modalInstance.close( null ); };
            $scope.local.cancel = function() { $modalInstance.dismiss( 'cancel' ); };
          }
        } ).result;
      };
    };

    return { instance: function( params ) { return new object( angular.isUndefined( params ) ? {} : params ); } };
  }
] );

/* ######################################################################################################## */

/**
 * TODO: document
 */
cenozo.service( 'CnModalTimezoneFactory', [
  '$modal', 'CnAppSingleton',
  function( $modal, CnAppSingleton ) {
    var object = function( params ) {
      var self = this;

      // service vars which can be defined by the contructor's params
      this.timezone = null;
      angular.extend( this, params );

      // service vars which cannot be defined by the constructor's params
      this.timezoneList = moment.tz.names();

      this.getTypeaheadValues = function( viewValue ) {
        var re = new RegExp( angular.lowercase( viewValue ) );
        return this.timezoneList.filter( function( value ) { return re.test( angular.lowercase( value ) ); } );
      };

      this.show = function() {
        return $modal.open( {
          backdrop: 'static',
          keyboard: true,
          modalFade: true,
          templateUrl: cenozo.baseUrl + '/app/cenozo/modal-timezone.tpl.html',
          controller: function( $scope, $modalInstance ) {
            $scope.local = self;
            $scope.local.ok = function() {
              $modalInstance.close( $scope.local.timezone );
            };
            $scope.local.cancel = function() { $modalInstance.close( false ); };
            $scope.local.siteTimezone = function() {
              $scope.local.timezone = CnAppSingleton.site.timezone;
            };
          }
        } ).result;
      };
    };

    return { instance: function( params ) { return new object( angular.isUndefined( params ) ? {} : params ); } };
  }
] );

/* ######################################################################################################## */

/**
 * TODO: document
 */
cenozo.service( 'CnModalTimezoneCalculatorFactory', [
  '$modal',
  function( $modal ) {
    var object = function( params ) {
      var self = this;
      angular.extend( this, params );

      this.show = function() {
        return $modal.open( {
          backdrop: 'static',
          keyboard: true,
          modalFade: false,
          templateUrl: cenozo.baseUrl + '/app/cenozo/modal-timezone-calculator.tpl.html',
          controller: function( $scope, $modalInstance ) {
            $scope.local = self;
            $scope.local.close = function() { $modalInstance.close(); };
          }
        } );
      };
    };

    return { instance: function( params ) { return new object( angular.isUndefined( params ) ? {} : params ); } };
  }
] );

/* ######################################################################################################## */

/**
 * TODO: document
 */
cenozo.service( 'CnModalValueFactory', [
  '$modal',
  function( $modal ) {
    var object = function( params ) {
      var self = this;
      this.title = 'Title';
      this.message = 'Message';
      this.enumList = null;
      this.value = null;
      angular.extend( this, params );

      this.show = function() {
        return $modal.open( {
          backdrop: 'static',
          keyboard: true,
          modalFade: true,
          templateUrl: cenozo.baseUrl + '/app/cenozo/modal-value.tpl.html',
          controller: function( $scope, $modalInstance ) {
            $scope.local = self;
            $scope.local.ok = function() { $modalInstance.close( $scope.local.value ); };
            $scope.local.cancel = function() { $modalInstance.close( false ); };
          }
        } ).result;
      };
    };

    return { instance: function( params ) { return new object( angular.isUndefined( params ) ? {} : params ); } };
  }
] );

/* ######################################################################################################## */

/**
 * TODO: document
 */
cenozo.factory( 'CnPaginationFactory',
  function CnPaginationFactory() {
    var object = function( params ) {
      this.currentPage = 1;
      this.showPageLimit = 10;
      this.itemsPerPage = 10;
      this.changePage = function() {};
      angular.extend( this, params );

      this.getMaxIndex = function() { return this.currentPage * this.itemsPerPage - 1; }
    };

    return { instance: function( params ) { return new object( angular.isUndefined( params ) ? {} : params ); } };
  }
);

/* ######################################################################################################## */

/**
 * TODO: document
 */
cenozo.config( [
  '$controllerProvider', '$compileProvider', '$filterProvider', '$provide',
  '$stateProvider', '$urlRouterProvider',
  function( $controllerProvider, $compileProvider, $filterProvider, $provide,
            $stateProvider, $urlRouterProvider ) {
    // create an object containing all providers
    cenozo.providers.controller = $controllerProvider.register;
    cenozo.providers.directive = $compileProvider.directive;
    cenozo.providers.filter = $filterProvider.register;
    cenozo.providers.factory = $provide.factory;
    cenozo.providers.service = $provide.service;
    cenozo.providers.provider = $provide.provider;
    cenozo.providers.value = $provide.value;
    cenozo.providers.constant = $provide.constant;
    cenozo.providers.decorator = $provide.decorator;

    // add the root states
    var baseRootUrl = cenozo.baseUrl + '/app/root/';
    $stateProvider.state( 'root', { // resolves application/
      url: '',
      controller: 'HomeCtrl',
      templateUrl: baseRootUrl + 'home.tpl.html',
      resolve: {
        data: [ '$q', function( $q ) {
          var deferred = $q.defer();
          require( [ baseRootUrl + 'bootstrap.js' ], function() { deferred.resolve(); } );
          return deferred.promise;
        } ]
      }
    } );
    $stateProvider.state( 'root.home', { url: '/' } ); // resolve application/#/

    // add the error states
    var baseErrorUrl = cenozo.baseUrl + '/app/error/';
    $stateProvider.state( 'error', {
      controller: 'ErrorCtrl',
      template: '<div ui-view class="fade-transition"></div>',
      resolve: {
        data: [ '$q', function( $q ) {
          var deferred = $q.defer();
          require( [ baseErrorUrl + 'bootstrap.js' ], function() { deferred.resolve(); } );
          return deferred.promise;
        } ]
      }
    } );
    $stateProvider.state( 'error.400', { templateUrl: baseErrorUrl + '400.tpl.html' } );
    $stateProvider.state( 'error.403', { templateUrl: baseErrorUrl + '403.tpl.html' } );
    $stateProvider.state( 'error.404', { templateUrl: baseErrorUrl + '404.tpl.html' } );
    $stateProvider.state( 'error.500', { templateUrl: baseErrorUrl + '500.tpl.html' } );
    $stateProvider.state( 'error.state', { templateUrl: baseErrorUrl + 'state.tpl.html' } );

    // load the 404 state when a state is not found for the provided path
    $urlRouterProvider.otherwise( function( $injector, $location ) {
      $injector.get( '$state' ).go( 'error.404' );
      return $location.path();
    } );
  }
] );

/* ######################################################################################################## */

/**
 * TODO: document
 */
cenozo.run( [
  '$state', '$rootScope',
  function( $state, $rootScope ) {
    $rootScope.$on( '$stateNotFound', function( event, unfoundState, fromState, fromParams ) {
      $state.go( 'error.state' );
    } );
    $rootScope.$on( '$stateChangeError', function( event, toState, toParams, fromState, fromParams, error ) {
      $state.go( 'error.404' );
    } );
  }
] );
