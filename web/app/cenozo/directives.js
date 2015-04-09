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
            scope.$apply( function() {
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
            var nowObj = new Date();
            nowObj.setTime( nowObj.getTime() + CnAppSingleton.site.timezone_offset * 1000 );
            var hours = ( nowObj.getUTCHours() < 10 ? '0' : '' ) + nowObj.getUTCHours();
            var minutes = ( nowObj.getUTCMinutes() < 10 ? '0' : '' ) + nowObj.getUTCMinutes();
            element.text( hours + ':' + minutes + ' ' + CnAppSingleton.site.timezone_name );
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
 * Creates a modal which can be opened based on the "visible" attribute
 * @attr heading
 * @attr visible
 */
cenozo.directive( 'cnModal', function() {
  return {
    templateUrl: cnCenozoUrl + '/app/cenozo/modal.tpl.html',
    heading: '@',
    restrict: 'E',
    transclude: true,
    replace: true,
    scope: true,
    link: function( scope, element, attrs ) {
      scope.$watch( attrs.visible, function( value ) {
        $(element).modal( value == true ? 'show' : 'hide' );
      } );

      $(element).on( 'shown.bs.modal', function() {
        // visible attribute might be in dot notation, so apply recursively
        scope.$apply( function() {
          attrs.visible.split( '.' ).reduce(
            function( obj, i ) {
              if( typeof obj[i] != "object" ) obj[i] = true;
              return obj[i];
            },
            scope.$parent
          );
        } );
      } );

      $(element).on( 'hidden.bs.modal', function() {
        // visible attribute might be in dot notation, so apply recursively
        scope.$apply( function() {
          attrs.visible.split( '.' ).reduce(
            function( obj, i ) {
              if( typeof obj[i] != "object" ) obj[i] = false;
              return obj[i];
            },
            scope.$parent
          );
        } );
      } );
    }
  };
} );

/**
 * A generic confirmation for risky actions.
 * @attr ng-really-message: The message to popup before proceeding
 * @attr cn-really-click: Callback function to call when action is confirmed
 * @attr ng-do-not-click: Callback function to call when action is cancelled
 */
cenozo.directive( 'cnReallyClick', function() {
  return {
    restrict: 'A',
    link: function( scope, element, attrs ) {
      element.bind( 'click', function() {
        var message = attrs.ngReallyMessage;
        if( message && confirm( message ) ) {
          scope.$apply( attrs.cnReallyClick );
        } else {
          scope.$apply( attrs.ngDoNotClick );
        }
      } );
    }
  }
} );

/**
 * A form for filling out a new record's details
 * @attr addModel: An instance of the record's add model
 * @attr listModel: An instance of the record's list (parent to the add model)
 */
cenozo.directive( 'cnRecordAdd', [
  '$state',
  function( $state ) {
    return {
      templateUrl: cnCenozoUrl + '/app/cenozo/record-add.tpl.html',
      restrict: 'E',
      transclude: true,
      scope: {
        addModel: '=',
        listModel: '='
      },
      controller: function( $scope ) {
        $scope.back = function() { $state.go( '^.list' ); };
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
            $scope.listModel.add( $scope.$parent.record ).then(
              function success( response ) { 
                $scope.$parent.record = $scope.addModel.createRecord();
                $scope.form.$setPristine();
                $state.go( $scope.listModel.subject + '.list' );
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
          }
        };
      },
      link: function( scope, element, attrs ) {
        scope.heading = undefined === attrs.heading
                      ? 'Creating A ' + scope.listModel.name.singular.ucWords()
                      : attrs.heading;

        scope.inputList = [];
        for( var key in scope.addModel.inputList ) {
          var input = scope.addModel.inputList[key];
          input.key = key;
          if( 'enum' == input.type ) {
          } else if( 'boolean' == input.type ) {
            input.enumList = [
              { value: undefined, name: '(Select Yes or No)' },
              { value: '1', name: 'Yes' },
              { value: '0', name: 'No' }
            ];
          }
          scope.inputList.push( input );
        }

        // watch for changes in the record (created asynchronously by the service)
        scope.$parent.$watch( 'record', function( record ) { scope.record = record; } );

        // watch for changes in metadata (created asynchronously by the service)
        scope.$watch( 'addModel.parentModel.metadata', function( metadata ) {
          if( undefined !== metadata ) {
            for( var key in metadata ) {
              if( undefined !== metadata[key].enumList ) {
                var input = scope.inputList.find( // by key
                  function( item, index, array ) { return key == item.key }
                );
                if( undefined === input.enumList ) {
                  input.enumList = metadata[key].enumList;
                  input.enumList.unshift( { value: undefined, name: '(Select a ' + input.title + ')' } );
                }
              }
            }
          }
        }, true );
      }
    };
  }
] );

/**
 * A listing of records
 * @attr listModel: An instance of the record's list (parent to the add model)
 * @attr removeColumns: An array of columns (by key) to remove from the default list
 */
cenozo.directive( 'cnRecordList', [
  '$state', 'CnModalRestrictFactory',
  function( $state, CnModalRestrictFactory ) {
    return {
      templateUrl: cnCenozoUrl + '/app/cenozo/record-list.tpl.html',
      restrict: 'E',
      scope: {
        listModel: '=',
        removeColumns: '@'
      },
      controller: function( $scope ) {
        if( $scope.listModel.addEnabled ) {
          $scope.addRecord = function() { $state.go( '^.add' ); };
        }

        if( $scope.listModel.deleteEnabled ) {
          $scope.deleteRecord = function( id ) {
            $scope.listModel.delete( id ).catch( function error( response ) { cnFatalError(); } );
          };
        }

        if( $scope.listModel.selectEnabled ) {
          $scope.selectRecord = function( record ) {
            if( $scope.listModel.selectMode ) {
              $scope.listModel.select( record ).catch( function error( response ) { cnFatalError(); } );
            }
          };
        } else if( $scope.listModel.viewEnabled ) {
          $scope.selectRecord = function( record ) { $state.go( '^.view', { id: record.id } ); };
        }
      },
      link: function( scope, element, attrs ) {
        scope.heading = undefined === attrs.heading
                      ? scope.listModel.name.singular.ucWords() + ' List'
                      : attrs.heading;

        if( undefined !== scope.listModel.restrict ) {
          scope.addRestrict = function( column ) {
            var modal = CnModalRestrictFactory.instance( {
              subject: scope.listModel.subject,
              column: scope.listModel.columnList[column].title,
              comparison: scope.listModel.columnList[column].restrict
            } ).show();
            modal.result.then( function( comparison ) {
              scope.listModel.restrict( column, comparison );
            } );
          };
        }

        // convert the columnList into an array
        var removeColumns = undefined === scope.removeColumns ? [] : scope.removeColumns.split( ' ' );
        scope.columnList = [];
        for( var key in scope.listModel.columnList ) {
          if( 0 > removeColumns.indexOf( key ) ) {
            var column = scope.listModel.columnList[key];
            if( undefined === column.allowRestrict ) column.allowRestrict = true;
            column.key = key;
            scope.columnList.push( column );
          }
        }

        // get the total number of columns in the table
        scope.numColumns = scope.columnList.length;
        if( scope.listModel.deleteEnabled ) scope.numColumns++;
      }
    };
  }
] );

/**
 * A form for editing an existing record's details
 * @attr viewModel: An instance of the record's view model
 * @attr listModel: An instance of the record's list (parent to the view model)
 */
cenozo.directive( 'cnRecordView', [
  '$state',
  function( $state ) {
    return {
      templateUrl: cnCenozoUrl + '/app/cenozo/record-view.tpl.html',
      restrict: 'E',
      scope: {
        listModel: '=',
        viewModel: '='
      },
      controller: function( $scope ) {
        $scope.back = function() { $state.go( '^.list' ); };

        $scope.delete = function() {
          $scope.listModel.delete( $scope.viewModel.record.id ).then(
            function success( response ) { $state.go( $scope.listModel.subject + '.list' ); },
            function error( response ) { cnFatalError(); }
          );
        };

        $scope.patch = function( property ) {
          var data = {};
          data[property] = $scope.viewModel.record[property];
          $scope.viewModel.patch( $scope.viewModel.record.id, data ).then(
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
          if( '.view' == fromState.name.substr( fromState.name.length - 5 ) ) {
            var viewModel = event.currentScope.$parent.cnView;
            if( undefined !== viewModel )
              for( var property in viewModel )
                if( 'object' == typeof viewModel[property] && true === viewModel[property].selectMode )
                  viewModel[property].toggleSelectMode();
          }
        } );

        scope.heading = undefined === attrs.heading
                      ? scope.listModel.name.singular.ucWords() + ' Details'
                      : attrs.heading;

        //scope.$parent.form = scope.form;

        scope.inputList = [];
        for( var key in scope.viewModel.inputList ) {
          var input = scope.viewModel.inputList[key];
          input.key = key;
          if( 'enum' == input.type ) {
          } else if( 'boolean' == input.type ) {
            input.enumList = [
              { value: undefined, name: '(Select Yes or No)' },
              { value: '1', name: 'Yes' },
              { value: '0', name: 'No' }
            ];
          }
          scope.inputList.push( input );
        }

        // watch for changes in the record (created asynchronously by the service)
        scope.$parent.$watch( 'record', function( record ) { scope.record = record; } );

        // watch for changes in metadata (created asynchronously by the service)
        scope.$watch( 'viewModel.parentModel.metadata', function( metadata ) {
          if( undefined !== metadata ) {
            for( var key in metadata ) {
              if( undefined !== metadata[key].enumList ) {
                var input = scope.inputList.find( // by key
                  function( item, index, array ) { return key == item.key }
                );
                if( undefined === input.enumList ) {
                  input.enumList = metadata[key].enumList;
                  input.enumList.unshift( { value: undefined, name: '(Select a ' + input.title + ')' } );
                }
              }
            }
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
      transclude: true,
      scope: true,
      controller: function( $scope ) {
        $scope.setSite = function( id ) {
          CnAppSingleton.setSite( id ).then( function() { $window.location.reload(); } );
        }

        $scope.setRole = function( id ) {
          CnAppSingleton.setRole( id ).then( function() { $window.location.reload(); } );
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
