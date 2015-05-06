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
      transclude: true,
      scope: true,
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
      link: function( scope, element, attrs, ctrl ) {
        if( 'checkbox' === attrs.type ||
            'radio' === attrs.type ||
            'SELECT' === element[0].tagName ) {
          ctrl.$viewChangeListeners.push( function() {
            scope.$eval( attrs.cnChange );
          } );
        } else {
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
      transclude: true,
      scope: true,
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
 * An interface to select date and time
 * @attr is-open
 * @attr enable-date
 * @attr enable-time
 * @attr todayText
 * @attr nowText
 * @attr dateText
 * @attr timeText
 * @attr clearText
 * @attr closeText
 * @attr cnDateDisabled
 */
cenozo.directive( 'cnDatetimePicker', [
  '$compile', '$parse', '$document', '$position', 'dateFilter', 'dateParser', 'datepickerPopupConfig',
  function( $compile, $parse, $document, $position, dateFilter, dateParser, datepickerPopupConfig ) {
    return {
      restrict: 'A',
      require: 'ngModel',
      scope: {
        isOpen: '=?',
        enableDate: '=?',
        enableTime: '=?',
        todayText: '@',
        nowText: '@',
        dateText: '@',
        timeText: '@',
        clearText: '@',
        closeText: '@',
        cnDateDisabled: '&'
      },
      link: function( scope, element, attrs, ngModel ) {
        var dateFormat,
          onDateSelection = angular.isDefined( attrs.onDateSelection )
                          ? attrs.onDateSelection
                          : ( datepickerPopupConfig.closeOnDateSelection ? "close" : null ),
          appendToBody = angular.isDefined( attrs.datepickerAppendToBody )
                       ? scope.$parent.$eval( attrs.datepickerAppendToBody )
                       : datepickerPopupConfig.appendToBody;

        scope.showButtonBar = angular.isDefined( attrs.showButtonBar )
                            ? scope.$parent.$eval( attrs.showButtonBar )
                            : datepickerPopupConfig.showButtonBar;
        
        // determine which pickers should be available. Defaults to date and time
        scope.enableDate = !( scope.enableDate == false );
        scope.enableTime = !( scope.enableTime == false );

        // default picker view
        scope.showPicker = scope.enableDate ? 'date' : 'time';

        // if date and time picker is available, set time picker to particular width to match datepicker
        scope.timeStyle = scope.enableDate && scope.enableTime
                        ? { 'min-width': '268px' }
                        : { 'min-width' : '160px' };

        scope.getText = function( key ) {
          var defaultText = key.charAt( 0 ).toUpperCase() + key.slice( 1 );
          return scope[key + 'Text'] || datepickerPopupConfig[key + 'Text'] || defaultText;
        };

        attrs.$observe( 'cnDatetimePicker', function( value ) {
          dateFormat = value || datepickerPopupConfig.datepickerPopup;
          ngModel.$render();
        } );

        // popup element used to display calendar
        var popupEl = angular.element( '' +
          '<cn-datetime-picker-popup>' +
            '<div collapse="showPicker == \'time\'">' +
              '<datepicker></datepicker>' +
            '</div>' +
            '<div collapse="showPicker == \'date\'" ng-style="timeStyle">' +
              '<timepicker style="margin:0 auto"></timepicker>' +
            '</div>' +
          '</cn-datetime-picker-popup>' );

        // get attributes from directive
        popupEl.attr( {
          'ng-model': 'date',
          'ng-change': 'dateSelection()'
        } );

        function cameltoDash( string ) {
          return string.replace( /([A-Z])/g, function( $1 ) { return '-' + $1.toLowerCase(); } );
        }

        // datepicker element
        var datepickerEl = angular.element( popupEl.children()[0].children[0] );
        if( attrs.datepickerOptions ) {
          angular.forEach(
            scope.$parent.$eval( attrs.datepickerOptions ),
            function( value, option ) { datepickerEl.attr( cameltoDash( option ), value ); }
          );
        }

        // timepicker element
        var timepickerEl = angular.element( popupEl.children()[1].children[0] );
        if( attrs.timepickerOptions ) {
          angular.forEach(
            scope.$parent.$eval( attrs.timepickerOptions ),
            function( value, option ) { timepickerEl.attr( cameltoDash( option ), value ); }
          );
        }

        scope.watchData = {};
        angular.forEach( ['minDate', 'maxDate', 'datepickerMode'], function( key ) {
          if( attrs[key] ) {
            var getAttribute = $parse( attrs[key] );
            scope.$parent.$watch( getAttribute, function( value ) { scope.watchData[key] = value; } );
            datepickerEl.attr( cameltoDash( key ), 'watchData.' + key );

            // Propagate changes from datepicker to outside
            if( key === 'datepickerMode' ) {
              var setAttribute = getAttribute.assign;
              scope.$watch( 'watchData.' + key, function( value, oldvalue ) {
                if( value !== oldvalue ) setAttribute( scope.$parent, value );
              } );
            }
          }
        } );

        if( attrs.dateDisabled ) {
          datepickerEl.attr( 'date-disabled', 'dateDisabled( { date: date, mode: mode } )' );
        }

        function parseDate( viewValue ) {
          if( !viewValue ) {
            ngModel.$setValidity( 'date', true );
            return null;
          } else if( angular.isDate( viewValue ) && !isNaN( viewValue ) ) {
            ngModel.$setValidity( 'date', true );
            return viewValue;
          } else if( angular.isString( viewValue ) ) {
            var date = dateParser.parse( viewValue, dateFormat ) || new Date( viewValue );
            if( isNaN( date ) ) {
              ngModel.$setValidity( 'date', false );
              return undefined;
            } else {
              ngModel.$setValidity( 'date', true );
              return date;
            }
          } else {
            ngModel.$setValidity( 'date', false );
            return undefined;
          }
        }
        ngModel.$parsers.unshift( parseDate );

        // Inner change
        scope.dateSelection = function( dt ) {
          if( angular.isDefined( dt ) ) scope.date = dt;
          ngModel.$setViewValue( scope.date );
          ngModel.$render();
          
          if( dt !== null && 'time' == onDateSelection && scope.showPicker != 'time' ) {
            scope.showPicker = 'time';
          }
          else if( 'close' == onDateSelection && scope.showPicker != 'time' ) {
            scope.isOpen = false;
            element[0].focus();
          }
        };

        element.bind( 'input change keyup', function() {
          scope.$apply( function() { scope.date = ngModel.$modelValue; } );
        } );

        // Outter change
        ngModel.$render = function() {
          var date = ngModel.$viewValue ? dateFilter( ngModel.$viewValue, dateFormat ) : '';
          element.val( date );
          scope.date = parseDate( ngModel.$modelValue );
        };

        var documentClickBind = function( event ) {
          if( scope.isOpen && event.target !== element[0] )
            scope.$apply( function() { scope.isOpen = false; } );
        };

        var keydown = function( evt, noApply ) { scope.keydown( evt ); };
        element.bind( 'keydown', keydown );

        scope.keydown = function( evt ) {
          if( evt.which === 27 ) {
            evt.preventDefault();
            evt.stopPropagation();
            scope.close();
          } else if( evt.which === 40 && !scope.isOpen ) scope.isOpen = true;
        };

        scope.$watch( 'isOpen', function( value ) {
          if( value ) {
            scope.$broadcast( 'datepicker.focus' );
            scope.position = appendToBody ? $position.offset( element ) : $position.position( element );
            scope.position.top -= ( element.prop( 'offsetHeight' ) + 250 );
            $document.bind( 'click', documentClickBind );
          } else $document.unbind( 'click', documentClickBind );
        } );

        scope.select = function( date ) {
          if( date === 'today' ) {
            var today = new Date();
            if( angular.isDate( ngModel.$modelValue ) ) {
              date = new Date( ngModel.$modelValue );
              date.setFullYear( today.getFullYear(), today.getMonth(), today.getDate() );
            } else date = new Date( today.setHours( 0, 0, 0, 0 ) );
          } else if( date === 'now' ) {
            if( angular.isDate( ngModel.$modelValue ) ) {
              var now = new Date();
              date = new Date( ngModel.$modelValue );
              date.setHours( now.getHours(), now.getMinutes(), 0, 0 );
            } else date = new Date();
          }
          scope.dateSelection( date );
        };

        scope.close = function() {
          scope.isOpen = false;
          element[0].focus();
        };

        scope.changePicker = function( e ) { scope.showPicker = e; };

        var $popup = $compile( popupEl )( scope );
        // Prevent jQuery cache memory leak ( template is now redundant after linking )
        popupEl.remove();

        if( appendToBody ) $document.find( 'body' ).append( $popup );
        else element.after( $popup );

        scope.$on( '$destroy', function() {
          $popup.remove();
          element.unbind( 'keydown', keydown );
          $document.unbind( 'click', documentClickBind );
        } );
      }
    };
  }
] );

/**
 * Popup for the datetime picker
 */
cenozo.directive( 'cnDatetimePickerPopup', function () {
  return {
    restrict: 'E',
    replace: true,
    transclude: true,
    templateUrl: cnCenozoUrl + '/app/cenozo/datetime-picker.tpl.html',
    link: function( scope, element ) {
      element.bind( 'click', function( event ) {
        event.preventDefault();
        event.stopPropagation();
      } ); 
    }   
  };  
} );

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
 */
cenozo.directive( 'cnRecordAdd', [
  'CnHttpFactory',
  function( CnHttpFactory ) {
    return {
      templateUrl: cnCenozoUrl + '/app/cenozo/record-add.tpl.html',
      restrict: 'E',
      transclude: true,
      scope: { model: '=' },
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
                $scope.$parent.record = $scope.model.cnAdd.createRecord();
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
                } else { cnFatalError(); }
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
            return response.data;
          } );
        };
      },
      link: function( scope, element, attrs ) {
        scope.heading = undefined === attrs.heading
                      ? 'Create ' + scope.model.name.singular.ucWords()
                      : attrs.heading;

        // get the input array and add enum lists for boolean types
        scope.inputArray = scope.model.getInputArray();
        for( var i = 0; i < scope.inputArray.length; i++ ) {
          if( 'boolean' == scope.inputArray[i].type ) {
            scope.inputArray[i].enumList = [
              { value: undefined, name: '(Select Yes or No)' },
              { value: '1', name: 'Yes' },
              { value: '0', name: 'No' }
            ];
          }
        }

        // watch for changes in the record (created asynchronously by the service)
        scope.$parent.$watch( 'record', function( record ) { scope.record = record; } );

        // watch for changes in metadata (created asynchronously by the service)
        scope.isComplete = false;
        scope.$watch( 'model.metadata', function( metadata ) {
          if( undefined !== metadata && !metadata.isLoading && !scope.isComplete ) {
            for( var key in metadata.columnList ) {
              if( undefined !== metadata.columnList[key].enumList ) {
                var input = scope.inputArray.find( // by key
                  function( item, index, array ) { return key == item.key }
                );
                if( undefined === input.enumList ) {
                  input.enumList = metadata.columnList[key].enumList;
                  input.enumList.unshift( metadata.columnList[key].required ?
                    { value: undefined, name: '(Select ' + input.title + ')' } :
                    { value: null, name: '' } );
                }
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
 * @attr removeColumns: An array of columns (by key) to remove from the default list
 */
cenozo.directive( 'cnRecordList', [
  'CnModalRestrictFactory',
  function( CnModalRestrictFactory ) {
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
          $scope.deleteRecord = function( id ) {
            $scope.model.cnList.onDelete( id ).catch( function error( response ) { cnFatalError(); } );
          };
        }

        if( $scope.model.chooseEnabled ) {
          $scope.chooseRecord = function( record ) {
            if( $scope.model.cnList.chooseMode ) {
              $scope.model.cnList.onChoose( record ).catch( function error( response ) { cnFatalError(); } );
            }
          };
        }
        
        if( $scope.model.viewEnabled ) {
          $scope.selectRecord = function( id ) {
            $scope.model.transitionToViewState( id );
          };
        }
      },
      link: function( scope, element, attrs ) {
        scope.heading = undefined === attrs.heading
                      ? scope.model.name.singular.ucWords() + ' List'
                      : attrs.heading;

        if( undefined !== scope.model.cnList.restrict ) {
          scope.addRestrict = function( column ) {
            var modal = CnModalRestrictFactory.instance( {
              name: scope.model.name,
              column: scope.model.columnList[column].title,
              comparison: scope.model.columnList[column].restrict
            } ).show().then( function( comparison ) {
              scope.model.cnList.restrict( column, comparison );
            } );
          };
        }

        // convert the columnList into an array
        var removeColumns = undefined === scope.removeColumns ? [] : scope.removeColumns.split( ' ' );
        scope.columnList = [];
        for( var key in scope.model.columnList ) {
          if( 0 > removeColumns.indexOf( key ) ) {
            var column = scope.model.columnList[key];
            if( undefined === column.allowRestrict ) column.allowRestrict = true;
            column.key = key;
            scope.columnList.push( column );
          }
        }

        // get the total number of columns in the table
        scope.numColumns = scope.columnList.length;
        if( scope.model.deleteEnabled ) scope.numColumns++;
      }
    };
  }
] );

/**
 * A form for editing an existing record's details
 * @attr model: An instance of the record's singleton model
 */
cenozo.directive( 'cnRecordView',
  function() {
    return {
      templateUrl: cnCenozoUrl + '/app/cenozo/record-view.tpl.html',
      restrict: 'E',
      scope: { model: '=', },
      controller: function( $scope ) {
        $scope.back = function() {
          $scope.model.transitionToLastState();
        };

        $scope.delete = function() {
          $scope.model.cnView.onDelete().then(
            function success( response ) { $scope.model.transitionToLastState(); },
            function error( response ) { cnFatalError(); }
          );
        };

        $scope.patch = function( property ) {
          var data = {};
          data[property] = $scope.model.cnView.record[property];
          $scope.model.cnView.onPatch( data ).then(
            function success( response ) { 
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

              // now clean up this property's form elements
              currentItem.$error = {};
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
              } else { cnFatalError(); }
            }
          );
        };
      },
      link: function( scope, element, attrs ) {
        // turn off any sub-list model currently in select mode whenever leaving a view model
        scope.$on( '$stateChangeStart', function( event, toState, toParams, fromState, fromParams ) {
          var stateName = fromState.name;
          if( 'view' == stateName.substring( stateName.lastIndexOf( '.' ) + 1 ) ) {
            for( var property in scope.model.cnView ) {
              if( 'object' == typeof scope.model.cnView[property] &&
                  'object' == typeof scope.model.cnView[property].cnList &&
                  true === scope.model.cnView[property].cnList.chooseMode ) {
                scope.model.cnView[property].cnList.toggleChooseMode();
              }
            }
          }
        } );

        scope.heading = undefined === attrs.heading
                      ? scope.model.name.singular.ucWords() + ' Details'
                      : attrs.heading;

        scope.inputArray = scope.model.getInputArray();
        var recordLoaded = false;
        scope.$watch( 'model.cnView.record', function( record ) {
          // convert datetimes
          if( undefined !== record.id && !recordLoaded ) {
            for( var key in scope.model.inputArray ) {
              if( 'date' == scope.model.inputArray[key].type && record[key].format )
                record[key] = record[key].format( 'YYYY-MM-DD' );
            }
            recordLoaded = true;
            if( recordLoaded && metadataLoaded ) scope.isComplete = true;
          }
        } );

        // watch for changes in metadata (created asynchronously by the service)
        var metadataLoaded = false;
        scope.isComplete = false;
        var unbind = scope.$watch( 'model.metadata', function( metadata ) {
          if( undefined !== metadata && !metadata.isLoading && !metadataLoaded ) {
            // build enum lists
            for( var key in metadata.columnList ) {
              var input = scope.inputArray.find( // by key
                function( item, index, array ) { return key == item.key }
              );
              if( undefined !== input && ( 'boolean' === input.type || 'enum' === input.type ) ) {
                input.enumList = 'boolean' === input.type
                               ? [ { value: '1', name: 'Yes' }, { value: '0', name: 'No' } ]
                               : metadata.columnList[key].enumList.slice();
                if( !metadata.columnList[key].required ) input.enumList.unshift( { value: '', name: '' } );
              }
            }
            metadataLoaded = true;
            if( recordLoaded && metadataLoaded ) scope.isComplete = true;
          }
        }, true );
      }
    };
  }
);

/**
 * Site and role drop-downs which will switch the user's current role
 */
cenozo.directive( 'cnSiteRoleSwitcher', [
  '$state', '$window', 'CnAppSingleton',
  function( $state, $window, CnAppSingleton ) {
    return {
      templateUrl: cnCenozoUrl + '/app/cenozo/site-role-switcher.tpl.html',
      restrict: 'E',
      transclude: true,
      scope: true,
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
      transclude: true,
      scope: true,
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

