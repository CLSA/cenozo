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
 * TODO: document
 */
cenozo.directive( 'cnApplicationTitle', [
  'CnStateSingleton',
  function( CnStateSingleton ) {
    return {
      template: '{{ application.title }} {{ application.version }}',
      restrict: 'E',
      transclude: true,
      scope: true,
      link: function( scope ) {
        var cnState = CnStateSingleton;
        cnState.promise.then( function() {
          scope.application = cnState.application;
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
cenozo.directive( 'cnChange', function() {
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
          scope.$timeout( function() { oldValue = element.val(); } );
        } );
        element.bind( 'blur', function() {
          scope.$apply( function() { if( element.val() != oldValue ) scope.$eval( attrs.cnChange ); } );
        } );
      }
    }
  };
} );

/**
 * TODO: document
 */
cenozo.directive( 'cnClock', [
  'CnStateSingleton', '$interval',
  function( CnStateSingleton, $interval ) {
    return {
      restrict: 'E',
      transclude: true,
      scope: true,
      link: function( scope, element, attrs ) {
        var cnState = CnStateSingleton;

        cnState.promise.then( function() {
          function updateTime() {
            var nowObj = new Date();
            nowObj.setTime( nowObj.getTime() + cnState.site.timezoneOffset * 1000 );
            var hours = ( nowObj.getUTCHours() < 10 ? '0' : '' ) + nowObj.getUTCHours();
            var minutes = ( nowObj.getUTCMinutes() < 10 ? '0' : '' ) + nowObj.getUTCMinutes();
            element.text( hours + ':' + minutes + ' ' + cnState.site.timezoneName );
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

        if( attrs.cbDateDisabled ) {
          datepickerEl.attr( 'date-disabled', 'cbDateDisabled( { date: date, mode: mode } )' );
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
    restrict: 'E',
    transclude: true,
    replace: true,
    scope: true,
    link: function( scope, element, attrs ) {
      scope.heading = attrs.heading;

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
 * TODO: document
 */
cenozo.directive( 'cnRecordAdd', [
  '$window',
  function( $window ) {
    return {
      templateUrl: cnCenozoUrl + '/app/cenozo/record-add.tpl.html',
      restrict: 'E',
      transclude: true,
      scope: {
        cbBack: '&',
        cbSubmit: '&'
      },
      link: function( scope ) {
        // pass form to next sibling (transclude) scope
        scope.$$nextSibling.form = scope.form;
        // pass record from next sibling (transclude) scope to the directive scope
        scope.record = scope.$$nextSibling.record;
        // pass form to parent (controller) scope
        scope.$parent.form = scope.form;
        // create the default back callback
        scope.cbBack = function() { $window.history.back(); };
      }
    };
  }
] );

/**
 * TODO: document
 */
cenozo.directive( 'cnRecordInput', function() {
  return {
    templateUrl: cnCenozoUrl + '/app/cenozo/record-input.tpl.html',
    restrict: 'E',
    transclude: true,
    scope: {
      form: '=',
      subject: '@',
      key: '@',
      title: '@'
    },
    link: function( scope, element, attrs, ctrl, transclude ) {
      // pass form to next sibling (transclude) scope
      scope.$$nextSibling.form = scope.form;
      
      transclude( scope, function( clone ) {
        // determine whether the transcluded markup has an input
        var hasInput = false;
        for( var i = 0; i < clone.length; i++ ) {
          if( 'INPUT' == clone[i].tagName ) {
            hasInput = true;
            break;
          }
          else if( undefined !== clone[i].tagName ) {
            if( 0 < clone[i].getElementsByTagName( 'INPUT' ).length ) {
              hasInput = true;
              break;
            }
          }
        }
        scope.hasInput = hasInput;
      } );
    },

  };
} );

/**
 * TODO: document
 */
cenozo.directive( 'cnRecordList', function() {
  return {
    templateUrl: cnCenozoUrl + '/app/cenozo/record-list.tpl.html',
    restrict: 'E',
    scope: {
      subject: '=',
      local: '=',
      removeColumns: '@',
      cbAdd: '&',
      cbAddRestrict: '&',
      cbDelete: '&',
      cbDeleteRestrict: '&',
      cbOrderBy: '&',
      cbView: '&'
    },
    link: function( scope, element, attrs ) {
      // if a callback isn't provided, make it false so it doesn't show
      if( undefined === attrs.cbAdd ) scope.cbAdd = false;
      if( undefined === attrs.cbAddRestrict ) scope.cbAddRestrict = false;
      if( undefined === attrs.cbDelete ) scope.cbDelete = false;
      if( undefined === attrs.cbDeleteRestrict ) scope.cbDeleteRestrict = false;
      if( undefined === attrs.cbOrderBy ) scope.cbOrderBy = false;
      if( undefined === attrs.cbView ) scope.cbView = false;

      // convert the columnList into an array
      var removeColumns = undefined === attrs.removeColumns ? [] : attrs.removeColumns.split( ' ' );
      scope.columnList = [];
      for( var key in scope.local.columnList ) {
        if( 0 > removeColumns.indexOf( key ) ) {
          var column = scope.local.columnList[key];
          if( undefined === column.allowRestrict ) column.allowRestrict = true;
          column.key = key;
          scope.columnList.push( column );
        }
      }
    }
  };
} );

/**
 * TODO: document
 */
cenozo.directive( 'cnRecordView', [
  '$window',
  function( $window ) {
    return {
      templateUrl: cnCenozoUrl + '/app/cenozo/record-view.tpl.html',
      restrict: 'E',
      transclude: true,
      scope: {
        subject: '=',
        record: '=ngModel',
        cbBack: '&',
        cbDelete: '&'
      },
      link: function( scope ) {
        // pass form to next sibling (transcluded) scope
        scope.$$nextSibling.form = scope.form;
        // pass form to parent (controller) scope
        scope.$parent.form = scope.form;
        // create the default back callback
        scope.cbBack = function() { $window.history.back(); };
      }
    };
  }
] );

/**
 * TODO: document
 */
cenozo.directive( 'cnSiteRolePicker', [
  '$window', 'CnStateSingleton',
  function( $window, CnStateSingleton ) {
    return {
      templateUrl: cnCenozoUrl + '/app/cenozo/site-role-picker.tpl.html',
      restrict: 'E',
      transclude: true,
      scope: true,
      link: function( scope ) {
        var cnState = CnStateSingleton;
        cnState.promise.then( function() {
          scope.site = cnState.site;
          scope.role = cnState.role;
          scope.siteList = cnState.siteList;

          // pre-select the role list
          for( var i = 0; i < scope.siteList.length; i++ )
            if( scope.site.id == scope.siteList[i].id )
              scope.roleList = scope.siteList[i].roleList;
        } );

        scope.cbSetSite = function( id ) {
          cnState.setSite( id ).then( function() { $window.location.reload(); } );
        }

        scope.cbSetRole = function( id ) {
          cnState.setRole( id ).then( function() { $window.location.reload(); } );
        }
      }
    };
  }
] );
