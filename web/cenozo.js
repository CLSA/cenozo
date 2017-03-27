/**
 * Cenozo client framework
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */
( function( window, document ) { 'use strict';

try {
  var cenozo = angular.module( 'cenozo' );
  console.warn( 'Trying to load cenozo.js more than once.' );
  return;
} catch( err ) {
  var cenozo = angular.module( 'cenozo', ['ngAnimate','ngSanitize','colorpicker.module'] );
}

// determine cenozo's base url
var tempUrl = document.getElementById( 'cenozo' ).src;
cenozo.baseUrl = tempUrl.substr( 0, tempUrl.indexOf( '/cenozo.js' ) );

// setup moment.timezone
moment.tz.setDefault( 'UTC' );

// Extend the Array prototype with extra functions
angular.extend( Array.prototype, {
  findIndexByProperty: function( property, value ) {
    var indexList = this.reduce( function( array, item, index ) {
      if( angular.isDefined( item[property] ) && value == item[property] ) array.push( index );
      return array;
    }, [] );
    if( 1 < indexList.length ) {
      console.warn(
        'More than one item found while searching array for object with property "%s", only returning the first.',
        property
      );
    }
    return 0 == indexList.length ? null : indexList[0];
  },
  findByProperty: function( property, value ) {
    var filtered = this.filter( function( item ) { return value == item[property]; } );
    if( 1 < filtered.length ) {
      console.warn(
        'More than one item found while searching array for object with property "%s", only returning the first.',
        property
      );
    }
    return 0 == filtered.length ? null : filtered[0];
  },
  isEqualTo: function( array ) {
    if( this === array ) return true;
    if( !angular.isArray( array ) ) return false;
    if( this.length != array.length) return false;

    return this.every( function( item, index ) {
      if( angular.isArray( item ) )
        return angular.isArray( array[index] ) ? item.isEqualTo( array[index] ) : false;
      else if( angular.isObject( item ) )
        return angular.isObject( array[index] ) ? cenozo.objectsAreEqual( item, array[index] ) : false;
      else return item == array[index];
    } );
  },
  getUnique: function() {
    var valueObj = {};
    return this.reduce( function( list, item ) {
      if( !angular.isDefined( valueObj[item] ) ) {
        valueObj[item] = true;
        list.push( item );
      }
      return list;
    }, [] );
  }
} );

// Extend the String prototype with extra functions
angular.extend( String.prototype, {
  snakeToCamel: function( first ) {
    if( angular.isUndefined( first ) ) first = false;
    var output = this.replace( /(\_\w)/g, function( $1 ) { return angular.uppercase( $1[1] ); } );
    if( first ) output = angular.uppercase( output.charAt(0) ) + output.slice(1);
    return output;
  },
  endsWith: function( suffix ) {
    return this.indexOf( suffix, this.length - suffix.length ) !== -1;
  },
  camelToSnake: function() {
    return this.replace( /([A-Z])/g, function( $1 ) { return '_' + angular.lowercase( $1 ); } )
               .replace( /^_/, '' );
  },
  ucWords: function() {
    return this.replace( /(^[a-z]| [a-z])/g, function( $1 ) { return angular.uppercase( $1 ); } );
  }
} );

// extend the application object
var cenozoApp = angular.module( 'cenozoApp', [
  'ui.bootstrap',
  'ui.router',
  'ui.slider',
  'cenozo'
] );

angular.extend( cenozoApp, {
  moduleList: {},

  getFileUrl: function( module, file, build ) {
    if( angular.isUndefined( build ) ) build = this.build;
    var url = this.baseUrl + '/app/';
    if( angular.isDefined( module ) ) url += module + '/';
    if( angular.isDefined( file ) ) url += file + '?build=' + build;
    return url;
  },

  // returns a reference to a module
  module: function( moduleName, mark ) {
    // by default modules are not marked
    if( angular.isUndefined( mark ) ) mark = false;

    if( angular.isUndefined( this.moduleList[moduleName] ) )
      throw new Error( 'Tried to load module "' + moduleName + '" which doesn\'t exist.' );

    var module = this.moduleList[moduleName];

    // check to make sure this particular function call only ever happens once
    if( mark ) {
      if( module.marked )
        throw new Error( 'Tried to load module "' + moduleName + '" which has already been loaded.' );
      module.marked = true;
    }

    return module;
  },

  // Defines all modules belonging to the Application
  setModuleList: function( list ) {
    var self = this;
    this.moduleList = list;
    for( var name in this.moduleList ) {
      if( "note" == name ) {
        // notes are handled by the alternate and participant modules
        try {
          var alternateModule = cenozoApp.module( 'alternate' );
          alternateModule.allowNoteDelete = angular.isDefined( this.moduleList.note.actions.delete );
          alternateModule.allowNoteEdit = angular.isDefined( this.moduleList.note.actions.edit );
          var participantModule = cenozoApp.module( 'participant' );
          participantModule.allowNoteDelete = angular.isDefined( this.moduleList.note.actions.delete );
          participantModule.allowNoteEdit = angular.isDefined( this.moduleList.note.actions.edit );
        } catch( err ) {} // do nothing if an exception was thrown
        delete this.moduleList.note;
      } else {
        var framework = cenozo.isFrameworkModule( name );
        angular.extend( this.moduleList[name], {
          marked: false,
          deferred: null,
          subject: {
            snake: name,
            camel: name.snakeToCamel( false ),
            Camel: name.snakeToCamel( true )
          },
          framework: framework,
          getFileUrl: function( file ) {
            var build = this.framework ? cenozo.build : cenozoApp.build;
            var url = ( this.framework ? cenozo.baseUrl : cenozoApp.baseUrl ) +
                      '/app/' + this.subject.snake + '/';
            if( angular.isDefined( file ) ) url += file + '?build=' + build;
            return url;
          },
          inputGroupList: [],
          columnList: {},
          extraOperationList: {
            add: [],
            calendar: [],
            list: [],
            view: []
          },
          getRequiredFiles: function() {
            // we require the main module.js
            var modules = [ this.getFileUrl( 'module.js' ) ];
            // if this is a framework module then also require the application's module extention
            if( this.framework ) modules.push( cenozoApp.getFileUrl( this.subject.snake, 'module.extend.js' ) );
            return modules;
          },
          /**
           * Inputs are added in the following form:
           * key: {
           *   column: the input's column name if different from key
           *   title: the user-friendly title of the input
           *   type: one of the following
           *     boolean: yes/no
           *     date: date (with no time)
           *     datetime: date and time (with no seconds)
           *     datetimesecond: date, time and seconds
           *     enum: set list of values (dropdown)
           *     hidden: download view data but does not show in the interface (for when it is used elsewhere)
           *     lookup-typeahead: list of typeahead values which are downloaded dynamically
           *     months: 12 checkboxes, one for every month
           *     rank: a ranked value (1st, 2nd, 3rd, etc)
           *     string: any string (use format for numbers, etc)
           *     text: any long string
           *     typeahead: like lookup-typeahead but values are not loaded (must be provided as an array)
           *   format: one of the following
           *     integer: will only accept integers
           *     float: will only accept float and integers
           *     alphanum: will only accept numbers and letters
           *     alpha_num: will only accept numbers, letters and underscores
           *     email: requires a valid email address (<name>@<domain>.<type>)
           *   regex: A regular expression that the input must match
           *   constant: one of the following:
           *     true: makes the input immutable when adding or viewing
           *     'add': makes the input immutable when adding but not viewing
           *     'view': makes the input immutable when viewing but not adding
           *   exclude: one of the following:
           *     'add': excludes an input (and its data in the record) when adding
           *     'view': excludes an input (and its data in the record) when viewing
           *   help: help text that pops up when mousing over an input
           *   typeahead: { (for lookup-typeahead types only)
           *     table: the table to lookup values from
           *     select: what is shown when selected (may be a CONCAT statement)
           *     where: an array of all columns in the table which can be matched
           *   }
           * }
           */
          addInput: function( groupTitle, key, input ) {
            // make sure the key is unique throughout all groups
            var foundGroup = null;
            if( this.inputGroupList.some( function( group ) {
              if( angular.isDefined( group.inputList[key] ) ) {
                foundGroup = group;
                return true;
              }
            } ) ) {
              console.error(
                'Cannot add input "%s" to group "%s" as it already exists in the existing group "%s".',
                key, groupTitle, foundGroup.title
              );
            } else {
              // add the key to the input
              input.key = key;

              // create the group if it doesn't exist
              var group = this.inputGroupList.findByProperty( 'title', groupTitle );
              if( !group ) {
                group = {
                  title: groupTitle,
                  expanded: false,
                  inputList: {}
                };
                this.inputGroupList.push( group );
              }
              group.inputList[key] = input;
            }
          },
          addInputAfter: function( groupTitle, afterKey, key, input ) {
            // make sure the key is unique throughout all groups
            var foundGroup = null;
            if( this.inputGroupList.some( function( group ) {
              if( angular.isDefined( group.inputList[key] ) ) {
                foundGroup = group;
                return true;
              }
            } ) ) {
              console.error(
                'Cannot add input "%s" to group "%s" after "%s" as it already exists in the existing group "%s".',
                key, groupTitle, afterKey, foundGroup.title
              );
            } else {
              // add the key to the input
              input.key = key;

              // create the group if it doesn't exist
              var group = this.inputGroupList.findByProperty( 'title', groupTitle );
              if( !group ) {
                console.error(
                  'Cannot add input "%s" to group "%s" after "%s" as the group doesn\'t exist.',
                  key, groupTitle, afterKey
                );
              } else {
                cenozo.insertPropertyAfter( group.inputList, afterKey, key, input );
              }
            }
          },
          addInputGroup: function( title, inputList, expanded ) {
            if( 0 == title.length ) expanded = true;
            else if( angular.isUndefined( expanded ) ) expanded = false;
            for( var key in inputList ) this.addInput( title, key, inputList[key] );
            this.inputGroupList.findByProperty( 'title', title ).collapsed = !expanded;
          },
          getInput: function( key ) {
            var input = null;
            this.inputGroupList.some( function( group ) {
              if( angular.isDefined( group.inputList[key] ) ) {
                input = group.inputList[key];
                return true;
              }
            } );

            return input;
          },

          /**
           * Add buttons in the footer of record-based directives.
           * 
           * @var type: one of "add", "calendar", "list or "view"
           * @var extraObject: an object containing the following properties:
           *        id: The id to give the operation's html button
           *        title: The button's title
           *        isIncluded: A function to determine if the operation shound be shown
           *          The function must return a boolean (default function returns true)
           *          This function will be passed two arguments: $state and model
           *        isDisabled: A function to determine if the operation is disabled
           *          The function must return a boolean (default function returns false)
           *          This function will be passed two arguments: $state and model
           *        classes: A space-separated list of css classes to apply to the button
           *        help: Help text to show in a tooltip popup dialog
           *        operation: A function to be executed when the button is clicked.
           *          This function will be passed two arguments: $state and model
           */
          addExtraOperation: function( type, extraObject ) {
            if( 0 > ['add','calendar','list','view'].indexOf( type ) )
              throw new Error( 'Adding extra operation with invalid type "' + type + '".' );
            if( angular.isUndefined( extraObject.isIncluded ) )
              extraObject.isIncluded = function() { return true; }
            if( angular.isUndefined( extraObject.isDisabled ) )
              extraObject.isDisabled = function() { return false; }
            this.removeExtraOperation( type, extraObject.title ); // remove first, so we replace
            this.extraOperationList[type].push( extraObject );
          },

          /**
           * Remove an extra operation by its title
           */
          removeExtraOperation: function( type, title ) {
            var index = this.extraOperationList[type].findIndexByProperty( 'title', title );
            if( null != index ) this.extraOperationList[type].splice( index, 1 );
          }
        } );
      }
    }

    // replace dependent names with references to the module objects themselves
    for( var name in this.moduleList ) {
      this.moduleList[name].children = this.moduleList[name].children.reduce( function( array, item ) {
        try {
          var module = self.module( item );
          if( module ) array.push( module );
        } catch( err ) {} // do nothing if an exception was thrown
        return array;
      }, [] );
      this.moduleList[name].choosing = this.moduleList[name].choosing.reduce( function( array, item ) {
        try {
          var module = self.module( item );
          if( module ) array.push( module );
        } catch( err ) {} // do nothing if an exception was thrown
        return array;
      }, [] );
    }

    // add the root and error pseudo-modules
    this.moduleList['root'] = {
      marked: false,
      subject: { snake: 'root', camel: 'root', Camel: 'Root' },
      framework: true,
      getFileUrl: function( file ) {
        var url = cenozo.baseUrl + '/app/' + this.subject.snake + '/';
        if( angular.isDefined( file ) ) url += file + '?build=' + cenozo.build;
        return url;
      },
      getRequiredFiles: function() {
        return [
          this.getFileUrl( 'module.js' ),
          cenozoApp.getFileUrl( this.subject.snake, 'module.extend.js' )
        ];
      },
    };
    this.moduleList['error'] = {
      marked: false,
      subject: { snake: 'error', camel: 'error', Camel: 'Error' },
      framework: true,
      getFileUrl: function( file ) {
        var url = cenozo.baseUrl + '/app/' + this.subject.snake + '/';
        if( angular.isDefined( file ) ) url += file + '?build=' + cenozo.build;
        return url;
      },
      getRequiredFiles: function() {
        return [
          this.getFileUrl( 'module.js' ),
          cenozoApp.getFileUrl( this.subject.snake, 'module.extend.js' )
        ];
      },
    };
  }
} );

// extend the framework object
angular.extend( cenozo, {
  providers: {},
  frameworkModules: {},

  xor: function( a, b ) {
    return ( a || b ) && !( a && b );
  },

  getFileUrl: function( module, file, build ) {
    if( angular.isUndefined( build ) ) build = cenozo.build;
    var url = this.baseUrl + '/app/';
    if( angular.isDefined( module ) ) url += module + '/';
    if( angular.isDefined( file ) ) url += file + '?build=' + build;
    return url;
  },

  // adds an extendable function to an object
  addExtendableFunction: function( object, name, fn ) {
    object['$$'+name] = fn;
    object[name] = function() { return object['$$'+name].apply( this, arguments ); }
  },

  // Inserts a new property into an objects after an existing property
  insertPropertyAfter: function( object, afterProperty, newProperty, value ) {
    if( angular.isUndefined( object[afterProperty] ) ) {
      console.error(
        'Tried to insert object new property "%s" after existing property "%s" which doesn\'t exist.',
        newProperty, afterProperty
      );
      return;
    } else if( angular.isDefined( object[newProperty] ) ) {
      console.error( 'Tried to insert object new property "%s" which already exists in the object.', newProperty );
      return;
    }

    // make a copy of all properties
    var properties = {};
    for( var prop in object ) {
      if( object.hasOwnProperty( prop ) ) {
        properties[prop] = object[prop];
        delete object[prop];
      }
    }

    // now loop through and add the new property as we go
    for( var prop in properties ) {
      object[prop] = properties[prop];
      if( afterProperty === prop ) object[newProperty] = value;
    }
  },

  // defines all modules belonging to the framework
  defineFrameworkModules: function( list ) { this.frameworkModules = list; },

  // returns whether a module belongs to the framework or not
  isFrameworkModule: function( moduleName ) { return 0 <= this.frameworkModules.indexOf( moduleName ); },

  objectsAreEqual: function( obj1, obj2 ) {
    if( !angular.isObject( obj1 ) ) {
      console.warn( 'When testing if objects are equal the first argument is not an object.' );
      return false;
    } else if( !angular.isObject( obj2 ) ) {
      console.warn( 'When testing if objects are equal the second argument is not an object.' );
      return false;
    }
    if( Object.keys( obj1 ).length != Object.keys( obj2 ).length ) return false;
    for( var key in obj1 )
      if( '$' != key[0] && ( angular.isUndefined( obj2[key] ) || obj1[key] != obj2[key] ) ) return false;
    return true;
  },

  // generate a globally unique identifier
  generateGUID: function() {
    var S4 = function() {
      return( ( ( 1+Math.random() ) * 0x10000 ) | 0 ).toString( 16 ).substring( 1 );
    };
    return( S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4() );
  },

  // get the type of a variable
  getType: function( variable ) {
    var type = ( {} ).toString.call( variable ).match( /\s([a-zA-Z]+)/ )[1].toLowerCase();
    // if an object, check for moment
    if( 'object' == type && variable._isAMomentObject ) type = 'moment';
    return type;
  },

  // determines whether a type is one of the datetime types (date or time)
  // subtype can be one of "date", "time", "second" or "timezone"
  isDatetimeType: function( type, subtype ) {
    var typeList = [];
    if( 'date' == subtype ) {
      typeList = [ 'datetimesecond', 'datetime', 'date', 'dob' ];
    } else if( 'time' == subtype ) {
      typeList = [ 'timesecond', 'timesecond_notz', 'time', 'time_notz' ];
    } else if( 'second' == subtype ) {
      typeList = [ 'datetimesecond', 'timesecond', 'timesecond_notz' ];
    } else if( 'timezone' == subtype ) {
      typeList = [ 'datetimesecond', 'datetime', 'timesecond', 'time' ];
    } else {
      typeList = [
        'datetimesecond', 'datetime', 'date', 'dob',
        'timesecond', 'timesecond_notz', 'time', 'time_notz'
      ];
    }

    return 0 <= typeList.indexOf( type );
  },

  // parse an enum list returned as column metadata
  parseEnumList: function( columnMetadata ) {
    return columnMetadata.type.replace( /^enum\(['"]/i, '' ).replace( /['"]\)$/, '' ).split( "','" );
  },

  // Sets up the routing for a module
  routeModule: function( stateProvider, name, module ) {
    if( angular.isUndefined( stateProvider ) ) throw new Error( 'routeModule requires exactly 3 parameters.' );
    if( angular.isUndefined( name ) ) throw new Error( 'routeModule requires exactly 3 parameters.' );
    if( angular.isUndefined( module ) ) throw new Error( 'routeModule requires exactly 3 parameters.' );

    var resolve = {
      // resolve the required files
      files: [ '$q', function( $q ) {
        if( null == module.deferred ) {
          module.deferred = $q.defer();
          require( module.getRequiredFiles(), function() { module.deferred.resolve(); } );
        }
        return module.deferred.promise;
      } ],
      // resolve the session
      session: function( CnSession ) { return CnSession.promise; }
    };

    if( 'root' == name ) {
      // add the root states
      stateProvider.state( name, { // resolves "application/"
        url: '',
        template: '<cn-home></cn-home>',
        resolve: resolve
      } );
      stateProvider.state( name + '.home', { url: cenozoApp.baseUrl + '/' } );
    } else if( 'self' == name ) {
      // add the wait state
      stateProvider.state( name, {
        template: '<div ui-view class="fade-transition"></div>',
      } );
      stateProvider.state( name + '.wait', { templateUrl: cenozo.getFileUrl( 'root', 'wait.tpl.html' ) } );
    } else if( 'error' == name ) {
      // add the error states
      stateProvider.state( name, {
        template: '<div ui-view class="fade-transition"></div>',
        resolve: resolve
      } );
      stateProvider.state( name + '.state', { template: '<cn-error></cn-error>', params: { type: 'state' } } );
      stateProvider.state( name + '.306', {
        template: '<cn-error></cn-error>', params: { type: 306, data: null }
      } );
      stateProvider.state( name + '.400', { template: '<cn-error></cn-error>', params: { type: 400 } } );
      stateProvider.state( name + '.403', { template: '<cn-error></cn-error>', params: { type: 403 } } );
      stateProvider.state( name + '.404', { template: '<cn-error></cn-error>', params: { type: 404 } } );
      stateProvider.state( name + '.406', { template: '<cn-error></cn-error>', params: { type: 406 } } );
      stateProvider.state( name + '.500', {
        template: '<cn-error></cn-error>', params: { type: 500, data: null }
      } );
    } else {
      // add base state
      stateProvider.state( name, {
        abstract: true,
        url: cenozoApp.baseUrl + '/' + name,
        templateUrl: this.getFileUrl( 'cenozo', 'view-frame.tpl.html' ),
        resolve: resolve
      } );

      // add action states
      for( var action in module.actions ) {
        if( 0 > ['delete', 'edit'].indexOf( action ) ) { // ignore delete and edit actions
          // the action's path is the action and the action's value which contains any variable parameters
          var url = '/' + action + module.actions[action];
          var directive = 'cn-' + module.subject.snake.replace( /_/g, '-' ) + '-' + action.replace( /_/g, '-' );
          stateProvider.state( name + '.' + action, {
            url: url,
            template: '<' + directive + '></' + directive + '>',
            // require that all child modules have loaded
            resolve: {
              childFiles: [ '$q', function( $q ) {
                // require that all child modules have loaded
                var promiseList = [];
                module.children.forEach( function( action ) {
                  var childModule = cenozoApp.module( action.subject.snake );
                  if( null == childModule.deferred ) {
                    childModule.deferred = $q.defer();
                    require( childModule.getRequiredFiles(), function() { childModule.deferred.resolve(); } );
                  }
                  promiseList.push( childModule.deferred );
                } );
                return $q.all( promiseList );
              } ]
            }
          } );
        }
      }

      // add child add states (if they exist)
      var baseAddUrl = angular.isDefined( module.actions.view )
                     ? module.actions.view.replace( '{identifier}', '{parentIdentifier}' )
                     : '{parentIdentifier}';
      baseAddUrl = '/view' + baseAddUrl;
      module.children.forEach( function( child ) {
        var childModule = cenozoApp.module( child.subject.snake );
        if( angular.isDefined( childModule.actions.add ) ) {
          var directive = 'cn-' + child.subject.snake.replace( /_/g, '-' ) + '-add';
          stateProvider.state( name + '.add_' + child.subject.snake, {
            url: baseAddUrl + '/' + child.subject.snake + childModule.actions.add,
            template: '<' + directive + '></' + directive + '>',
            resolve: {
              childFiles: [ '$q', function( $q ) {
                // require that the action module has loaded
                if( null == childModule.deferred ) {
                  childModule.deferred = $q.defer();
                  require( childModule.getRequiredFiles(), function() { childModule.deferred.resolve(); } );
                }
                return childModule.deferred.promise;
              } ]
            }
          } );
        }
      } );
    }
  },

  // Used to set up the routing for a module
  updateFormElement: function( element, clean ) {
    if( angular.isUndefined( clean ) ) clean = false;
    var invalid = false;
    for( var error in element.$error ) {
      invalid = ( 'custom' == error && 0 < element.$error[error].length ) || true === element.$error[error];
      if( invalid ) break;
    }
    if( clean ) element.$dirty = invalid;
    element.$invalid = invalid;
  },

  // searches a scope's child scopes for a particular directive
  findChildDirectiveScope: function( scope, directiveName ) {
    var childScope = scope.$$childHead;
    while( null != childScope && directiveName != childScope.directive )
      childScope = childScope.$$nextSibling;
    if( directiveName != childScope.directive ) childScope = null;
    return childScope;
  },

  // executes a function on all child scopes for a given scope
  // the function will be passed the child scope as an argument
  forAllChildDirectiveScopes: function( scope, fn ) {
    var childScope = scope.$$childHead;
    while( null !== childScope ) {
      fn( childScope );
      childScope = childScope.$$nextSibling;
    }
  },

  // gets the scope of any element found using a query selector
  getScopeByQuerySelector: function( selector ) {
    return angular.element( angular.element( document.querySelector( selector ) ) ).scope();
  },

  // gets an array of scopes of any elements found using a query selector
  forEachFormElement: function( formName, fn ) {
    var elementList = document.querySelectorAll( "[name=" + formName + "] [name=name]" );
    // note, we can't use array functions in the results of querySelectorAll()
    for( var i = 0; i < elementList.length; i++ ) {
      fn( cenozo.getFormElement( elementList[i].id ) );
    }
  },

  // gets a dynamic form's element (it assumes that each input is embedded into an innerForm)
  getFormElement: function( property ) {
    var scope = cenozo.getScopeByQuerySelector( '#' + property );
    return scope ? scope.$parent.innerForm.name : null;
  },

  // returns the column-type from a restriction (used by report* modules)
  getTypeFromRestriction: function( restriction ) {
    var type = restriction.restriction_type;
    if( 'table' == type ) return 'enum';
    else if( 'boolean' == type ) return 'boolean';
    else if( 'uid_list' == type ) return 'text';
    else if( 'integer' == type ) return 'string';
    else if( 'decimal' == type ) return 'string';
    else if( 'enum' == type ) return 'enum';
    else return type;
  },

  // returns an input object from a restriction (used by report* modules)
  inputFromRestrictionCache: {},
  getInputFromRestriction: function( restriction, CnHttpFactory ) {
    if( angular.isUndefined( this.inputFromRestrictionCache[restriction.id] ) ) {
      var key = 'restrict_' + restriction.name;
      var type = restriction.restriction_type;
      var promiseList = [];
      var input = {
        key: key,
        title: restriction.title,
        type: this.getTypeFromRestriction( restriction ),
        constant: 'view',
        help: restriction.description
      };

      if( 'table' == type ) {
        // loop through the subject column data to determine the http data
        input.enumList = [ {
          value: undefined,
          name: restriction.mandatory ? '(Select ' + restriction.title + ')' : '(all)'
        } ];

        promiseList.push(
          CnHttpFactory.instance( {
            path: restriction.subject
          } ).head().then( function( response ) {
            var data = {
              modifier: {
                where: [],
                order: undefined
              },
              select: { column: [ 'id' ] }
            };
            var columnList = angular.fromJson( response.headers( 'Columns' ) );
            for( var column in columnList ) {
              if( 'active' == column )
                data.modifier.where.push( { column: 'active', operator: '=', value: true } );
              else if( 'name' == column ) {
                data.modifier.order = { name: false };
                data.select.column.push( 'name' );
              }
            };

            // query the table for the enum list
            return CnHttpFactory.instance( {
              path: restriction.subject,
              data: data
            } ).get().then( function( response ) {
              response.data.forEach( function( item ) {
                input.enumList.push( { value: item.id, name: item.name } );
              } );
              if( restriction.null_allowed ) input.enumList.push( { value: '_NULL_', name: '(empty)' } );
            } );
          } )
        );
      } else if( 'boolean' == type ) {
        input.enumList = [ {
          value: undefined,
          name: restriction.mandatory ? '(Select ' + restriction.title + ')' : '(all)'
        }, {
          value: true, name: 'Yes'
        }, {
          value: false, name: 'No'
        } ];
        if( restriction.null_allowed ) input.enumList.push( { value: '_NULL_', name: '(empty)' } );
      } else if( 'enum' == type ) {
        input.enumList = angular.fromJson( '[' + restriction.enum_list + ']' ).reduce(
          function( list, name ) {
            list.push( { value: name, name: name } );
            return list;
          },
          [ {
            value: undefined,
            name: restriction.mandatory ? '(Select ' + restriction.title + ')' : '(all)'
          } ]
        );
        if( restriction.null_allowed ) input.enumList.push( { value: '_NULL_', name: '(empty)' } );
      }

      this.inputFromRestrictionCache[restriction.id] = { input: input, promiseList: promiseList };
    }

    return this.inputFromRestrictionCache[restriction.id];
  }

} );

/* ######################################################################################################## */

/**
 * Animation used to fade between states
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
 * Controller for the header/menu system
 */
cenozo.service( 'CnBaseHeader', [
  '$state', '$interval', '$window', 'CnSession', 'CnHttpFactory',
  'CnModalAccountFactory', 'CnModalPasswordFactory', 'CnModalTimezoneFactory',
  function( $state, $interval, $window, CnSession, CnHttpFactory,
            CnModalAccountFactory, CnModalPasswordFactory, CnModalTimezoneFactory ) {
    return {
      construct: function( scope ) {
        // update the time once the session has finished loading
        CnSession.promise.finally( function() {
          CnSession.updateTime();
          $interval( CnSession.updateTime, 1000 );
          scope.isLoading = false;
        } );

        scope.isCollapsed = false;
        scope.isLoading = true;
        scope.session = CnSession;

        // a list of all possible operations that the menu controller has to choose from
        scope.operationList = [ {
          title: 'Account',
          help: 'Edit your account details',
          execute: function() {
            CnModalAccountFactory.instance( { user: CnSession.user } ).show().then( function( response ) {
              if( response ) CnSession.setUserDetails();
            } );
          }
        }, {
          title: 'Timezone',
          help: 'Change which timezone to display',
          execute: function() {
            CnModalTimezoneFactory.instance( {
              timezone: CnSession.user.timezone,
              use12hourClock: CnSession.user.use12hourClock
            } ).show().then( function( response ) {
              if( response && (
                    response.timezone != CnSession.user.timezone ||
                    response.use12hourClock != CnSession.user.use12hourClock ) ) {
                CnSession.user.timezone = response.timezone;
                CnSession.user.use12hourClock = response.use12hourClock;
                CnSession.setTimezone( response.timezone, response.use12hourClock ).then( function() {
                  $state.go( 'self.wait' ).then( function() { $window.location.reload(); } );
                } );
              }
            } );
          }
        }, {
          title: 'Password',
          help: 'Change your password',
          execute: function() {
            CnModalPasswordFactory.instance().show().then( function( response ) {
              if( angular.isObject( response ) ) {
                CnSession.setPassword( response.currentPass, response.requestedPass );
              }
            } );
          }
        }, {
          title: 'Logout',
          help: 'Logout of the application',
          execute: function() { CnSession.logout(); }
        } ];
      }
    }
  }
] );

/* ######################################################################################################## */

/**
 * Manually compiles the element, fixing the recursion loop.
 * @param element
 * @param [link] A post-link function, or an object with function(s) registered via pre and post properties.
 * @returns An object containing the linking functions.
 */
cenozo.service( 'CnRecursionHelper', [
  '$compile',
  function( $compile ) {
    return {
      compile: function( element, link ) {
        // Normalize the link parameter
        if( angular.isFunction( link )) link = { post: link };

        // Break the recursion loop by removing the contents
        var contents = element.contents().remove();
        var compiledContents;
        return {
          pre: ( link && link.pre ) ? link.pre : null,
          // Compiles and re-adds the contents
          post: function( scope, element ) {
            // Compile the contents
            if( !compiledContents ) compiledContents = $compile( contents );
            // Re-add the compiled contents to the element
            compiledContents( scope, function( clone ) { element.append( clone ); } );
            // Call the post-linking function, if any
            if( link && link.post ) link.post.apply( null, arguments );
          }
        };
      }
    };
  }
] );

/* ######################################################################################################## */

/**
 * Allows elements to be autofocused even if they are loaded after page load (useful for modals)
 */
cenozo.directive( 'cnAutofocus', [
  '$timeout',
  function( $timeout ) {
    return {
      restrict: 'A',
      link: function( scope, element ) {
        $timeout( function() { element[0].focus(); }, 100 );
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
      controller: function( $scope ) { $scope.directive = 'cnChange'; },
      link: function( scope, element, attrs ) {
        var oldValue = null;
        element.bind( 'focus', function() {
          $timeout( function() { oldValue = element.val(); } );
        } );
        element.bind( 'blur', function() {
          scope.$evalAsync( function() { if( element.val() != oldValue ) scope.$eval( attrs.cnChange ); } );
        } );
        if( !element.is( 'textarea' ) ) {
          element.bind( 'keydown', function( event ) {
            scope.$evalAsync( function() {
              if( 13 == event.which ) {
                scope.$eval( attrs.cnChange );
                oldValue = element.val(); // update the old value, otherwise the blur event will fire
                event.target.blur();
              }
            } );
          } );
        }
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
      controller: function( $scope ) { $scope.directive = 'cnElastic'; },
      link: function( $scope, element ) {
        $scope.initialHeight = $scope.initialHeight || element[0].style.height;
        var resize = function() {
          element[0].style.height = $scope.initialHeight; // affects scrollHeight
          var height = element[0].scrollHeight + 2;
          if( height > 700 ) height = 700; // maximum height of 700 pixels
          element[0].style.height = height + 'px';
        };
        element.on( 'blur focus keyup mouseup change', function() { $timeout( resize, 200 ) } );
        $timeout( resize, 200 );
      }
    };
  }
] );

/* ######################################################################################################## */

/**
 * Shows a loading component
 */
cenozo.directive( 'cnLoading',
  function() {
    return {
      templateUrl: cenozo.getFileUrl( 'cenozo', 'loading.tpl.html' ),
      restrict: 'E',
      scope: false,
      controller: function( $scope ) {
        $scope.directive = 'cnLoading';
      },
      link: function( scope, element, attrs ) {
        scope.message = angular.isDefined( attrs.message )
                      ? attrs.message
                      : 'Waiting for a response from the server';
      }
    };
  }
);

/* ######################################################################################################## */

/**
 * Adds functionality to allow some select options to be disabled
 */
cenozo.directive( 'cnOptionsDisabled', [
  '$parse',
  function( $parse ) {
    function disableOptions( scope, attr, element, data, fnDisableIfTrue ) {
      // refresh the disabled options in the select element.
      if( angular.isDefined( data ) ) {
        var options = element.find( 'option' );
        for( var pos = 0, index = 0; pos < options.length; pos++ ) {
          var elem = angular.element( options[pos] );
          if( elem.val() != '' ) {
            var locals = {};
            locals[attr] = data[index];
            elem.attr( 'disabled', fnDisableIfTrue( scope, locals ) );
            index++;
          }
        }
      }
    };
    return {
      priority: 0,
      require: 'ngModel',
      controller: function( $scope ) { $scope.directive = 'cnOptionsDisabled'; },
      link: function( scope, element, attrs, ctrl ) {
        // parse expression and build array of disabled options
        var expElements = attrs.cnOptionsDisabled.match( /^\s*(.+)\s+for\s+(.+)\s+in\s+(.+)?\s*/ );
        var attrToWatch = expElements[3];
        var fnDisableIfTrue = $parse( expElements[1] );
        scope.$watch( attrToWatch, function( newValue, oldValue ) {
          if( newValue ) disableOptions( scope, expElements[2], element, newValue, fnDisableIfTrue );
        }, true );
        // handle model updates properly
        scope.$watch( attrs.ngModel, function( newValue, oldValue ) {
          var disOptions = $parse( attrToWatch )( scope );
          if( newValue ) disableOptions( scope, expElements[2], element, disOptions, fnDisableIfTrue );
        } );
      }
    };
  }
] );

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
      controller: function( $scope ) { $scope.directive = 'cnReallyClick'; },
      link: function( scope, element, attrs ) {
        element.bind( 'click', function() {
          var message = attrs.cnReallyMessage;
          CnModalConfirmFactory.instance( {
            title: angular.isDefined( attrs.cnReallyTitle ) ? attrs.cnReallyTitle : 'Please Confirm',
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
 * @attr model: An instance of the subject's model
 * @attr removeInputs: An array of inputs (by key) to remove from the form
 */
cenozo.directive( 'cnRecordAdd', [
  '$filter', '$state', 'CnSession', 'CnModalDatetimeFactory', 'CnHttpFactory',
  function( $filter, $state, CnSession, CnModalDatetimeFactory, CnHttpFactory ) {
    return {
      templateUrl: cenozo.getFileUrl( 'cenozo', 'record-add.tpl.html' ),
      restrict: 'E',
      scope: {
        model: '=',
        footerAtTop: '@',
        removeInputs: '@'
      },
      controller: function( $scope ) {
        $scope.directive = 'cnRecordAdd';
        $scope.record = {};
        $scope.isComplete = false;
        $scope.model.addModel.onNew( $scope.record ).then( function() {
          $scope.model.metadata.getPromise().then( function() {
            if( 'add' == $scope.model.getActionFromState().substring( 0, 3 ) )
              $scope.model.setupBreadcrumbTrail();

            $scope.dataArray.forEach( function( group ) {
              group.inputArray.forEach( function( input ) {
                var meta = $scope.model.metadata.columnList[input.key];
                if( angular.isDefined( meta ) && angular.isDefined( meta.enumList ) ) {
                  // process the input's enum-list
                  var enumList = angular.copy( meta.enumList );

                  // add additional rank
                  var newRank = enumList.length + 1;
                  if( 'rank' == input.key ) enumList.push( {
                    value: newRank,
                    name: $filter( 'cnOrdinal' )( newRank )
                  } );

                  if( !meta.required || 1 < enumList.length ) {
                    var name = meta.required ? '(Select ' + input.title + ')' : '(empty)';
                    if( null == enumList.findByProperty( 'name', name ) )
                      enumList.unshift( { value: undefined, name: name } );
                  }

                  if( 1 == enumList.length ) $scope.record[input.key] = enumList[0].value;
                  input.enumList = enumList;
                } else if( 'lookup-typeahead' == input.type ) {
                  // use the default value if one is provided
                  var defaultValue = $scope.model.module.getInput( input.key ).default;
                  if( angular.isObject( defaultValue ) &&
                      angular.isDefined( defaultValue.id ) &&
                      angular.isDefined( defaultValue.formatted ) ) {
                    $scope.record[input.key] = defaultValue.id;
                    $scope.formattedRecord[input.key] = defaultValue.formatted;
                  } else {
                    // apply parent values to lookup-typeaheads
                    var parent = $scope.model.getParentIdentifier();
                    if( angular.isDefined( parent.subject ) &&
                        angular.isDefined( parent.identifier ) &&
                        angular.isDefined( input.typeahead ) &&
                        parent.subject == input.typeahead.table ) {
                      CnHttpFactory.instance( {
                        path: input.typeahead.table + '/' + parent.identifier,
                        data: {
                          select: {
                            column: [ 'id', {
                              column: input.typeahead.select,
                              alias: 'value',
                              table_prefix: false
                            } ]
                          }
                        }
                      } ).get().then( function( response ) {
                        $scope.record[input.key] = response.data.id;
                        $scope.formattedRecord[input.key] = response.data.value;
                      } );
                    }
                  }
                } else if( 'size' == input.type ) {
                  $scope.formattedRecord[input.key] = [ '', 'Bytes' ];
                }
              } );
            } );
          } );
        } ).finally( function() { $scope.isComplete = true; } );

        $scope.cancel = function() { $scope.model.addModel.transitionOnCancel(); };

        $scope.check = function( property ) {
          // convert size types and write record property from formatted record
          var input = null;
          $scope.dataArray.some( function( group ) {
            input = group.inputArray.findByProperty( 'key', property );
            if( null != input ) return true;
          } );
          if( null != input && 'size' == input.type )
            $scope.record[property] =
              $filter( 'cnSize' )( $scope.formattedRecord[property].join( ' ' ), true );

          // test the format
          var element = cenozo.getFormElement( property );
          if( element ) {
            element.$error.format = !$scope.model.testFormat( property, $scope.record[property] );
            cenozo.updateFormElement( element, true );
          }
        };

        $scope.save = function() {
          if( !$scope.form.$valid ) {
            // dirty all inputs so we can find the problem
            cenozo.forEachFormElement( 'form', function( element ) { element.$dirty = true; } );
          } else {
            $scope.isAdding = true;
            $scope.model.addModel.onAdd( $scope.record ).then( function( response ) {
              // create a new record to be created (in case another record is added)
              $scope.model.addModel.onNew( $scope.record );
              $scope.form.$setPristine();
              $scope.model.addModel.transitionOnSave( $scope.record );
            } ).finally( function() { $scope.isAdding = false; } );
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
          $scope.model.metadata.getPromise().then( function() {
            CnModalDatetimeFactory.instance( {
              title: input.title,
              date: $scope.record[input.key],
              minDate: angular.isDefined( $scope.record[input.min] ) ? $scope.record[input.min] : input.min,
              maxDate: angular.isDefined( $scope.record[input.max] ) ? $scope.record[input.max] : input.max,
              pickerType: input.type,
              emptyAllowed: !$scope.model.metadata.columnList[input.key].required
            } ).show().then( function( response ) {
              if( false !== response ) {
                $scope.record[input.key] = response;
                $scope.formattedRecord[input.key] = CnSession.formatValue( response, input.type, true );
              }
            } );
          } );
        };
      },
      link: function( scope, element, attrs ) {
        if( angular.isUndefined( scope.model ) ) {
          console.error( 'Cannot render cn-record-add, no model provided.' );
        } else {
          scope.$state = $state;
          scope.isAdding = false;
          scope.formattedRecord = {};

          // watch the model's heading in case it changes
          scope.$watch( 'model.addModel.heading', function( heading ) {
            scope.heading = heading ? heading : 'Create ' + scope.model.module.name.singular.ucWords();
          } );

          // get the data array and add enum lists for boolean types
          var removeInputs = angular.isDefined( scope.removeInputs ) ? scope.removeInputs.split( ' ' ) : []
          scope.dataArray = scope.model.getDataArray( removeInputs, 'add' );
          scope.dataArray.forEach( function( group ) {
            group.inputArray.forEach( function( item ) {
              if( 'boolean' == item.type ) {
                item.enumList = [
                  { value: undefined, name: '(Select Yes or No)' },
                  { value: true, name: 'Yes' },
                  { value: false, name: 'No' }
                ];
              }
            } );
          } );
        }
      }
    };
  }
] );

/* ######################################################################################################## */

/**
 * A directive wrapper for FullCalendar
 */
cenozo.directive( 'cnRecordCalendar', [
  '$state', 'CnSession', 'CnModalSiteFactory',
  function( $state, CnSession, CnModalSiteFactory ) {
    var calendarElement = null;
    return {
      templateUrl: cenozo.getFileUrl( 'cenozo', 'record-calendar.tpl.html' ),
      restrict: 'E',
      scope: {
        model: '=',
        preventSiteChange: '@?'
      },
      controller: function( $scope, $element ) {
        $scope.directive = 'cnRecordCalendar';
        $scope.reportTypeListOpen = false;
        $scope.refresh = function() {
          if( !$scope.model.calendarModel.isLoading ) {
            $scope.model.calendarModel.onCalendar( true ).then( function() {
              $element.find( 'div.calendar' ).fullCalendar( 'refetchEvents' );
            } );
          }
        };

        $scope.clickHeading = function() {
          CnModalSiteFactory.instance( { id: $scope.model.site.id } ).show().then( function( siteId ) {
            if( siteId ) {
              $state.go( $state.current.name, {
                identifier: CnSession.siteList.findByProperty( 'id', siteId ).getIdentifier()
              } );
            }
          } );
        };

        $scope.toggleReportTypeDropdown = function() {
          $element.find( '.report-dropdown' ).find( '.dropdown-menu' ).toggle();
        };

        $scope.getReport = function( format ) {
          $scope.model.calendarModel.onReport( format ).then( function() {
            saveAs( $scope.model.calendarModel.reportBlob, $scope.model.calendarModel.reportFilename );
          } );
          $scope.toggleReportTypeDropdown();
        };

        // only include a viewList operation if the state exists
        var find = $state.current.name.substr( 0, $state.current.name.indexOf( '.' ) ) + '.list';
        $state.get().some( function( state ) {
          if( find == state.name ) {
            $scope.viewList = function() { $scope.model.calendarModel.transitionOnList(); };
            return true; // stop processing
          }
        } );
      },
      link: function( scope, element, attrs ) {
        if( angular.isUndefined( scope.model ) ) {
          console.error( 'Cannot render cn-record-calendar, no model provided.' );
        } else {
          if( angular.isString( scope.preventSiteChange ) )
            scope.preventSiteChange = 'true' == scope.preventSiteChange;
          scope.$state = $state;
          scope.allowChangeSite = CnSession.role.allSites && !scope.preventSiteChange;

          // watch the model's heading in case it changes
          scope.$watch( 'model.calendarModel.heading', function( heading ) {
            scope.heading = heading ? heading : scope.model.module.name.singular.ucWords() + ' Calendar';
          } );

          // use the full calendar lib to create the calendar
          angular.extend( scope.model.calendarModel.settings, {
            timeFormat: CnSession.user.use12hourClock ? 'h:mmt' : 'H:mm',
            smallTimeFormat: CnSession.user.use12hourClock ? 'h(:mm)t' : 'HH(:mm)',
            businessHours: {
              start: CnSession.setting.callingStartTime,
              end: CnSession.setting.callingEndTime,
              dow: [1, 2, 3, 4, 5]
            },
            defaultDate: scope.model.calendarModel.currentDate,
            defaultView: scope.model.calendarModel.currentView
          } );

          var el = element.find( 'div.calendar' );
          el.fullCalendar( scope.model.calendarModel.settings );

          // integrate classes and styles
          el.find( 'button' ).removeClass( 'fc-button fc-corner-left fc-corner-right fc-state-default' );
          el.find( 'button' ).not( '.fc-today-button' ).addClass( 'btn btn-default' );
          el.find( '.fc-today-button' ).addClass( 'btn btn-info' );
          el.find( 'h2' ).css( { 'font-size': '18px', 'line-height': '1.6' } );
          el.find( '.fc-left' ).css( 'width', '33%' );
          el.find( '.fc-right' ).css( 'width', '33%' ).children().css( 'float', 'right' );
          el.find( '.fc-button-group' ).addClass( 'btn-group' );
        }
      }
    };
  }
] );

/* ######################################################################################################## */

/**
 * A listing of records
 * @attr model: An instance of the subject's model
 * @attr removeColumns: An array of columns (by key) to remove from the list
 */
cenozo.directive( 'cnRecordList', [
  '$state', 'CnSession', 'CnModalRestrictFactory', 'CnHttpFactory',
  function( $state, CnSession, CnModalRestrictFactory, CnHttpFactory ) {
    return {
      templateUrl: cenozo.getFileUrl( 'cenozo', 'record-list.tpl.html' ),
      restrict: 'E',
      scope: {
        model: '=',
        removeColumns: '@',
        initCollapsed: '@'
      },
      controller: function( $scope, $element ) {
        $scope.directive = 'cnRecordList';
        $scope.reportTypeListOpen = false;
        $scope.applyingChoose = false;

        $scope.model.listModel.onList( true ).then( function() {
          if( 'list' == $scope.model.getActionFromState() ) $scope.model.setupBreadcrumbTrail();
        } );

        $scope.refresh = function() {
          if( !$scope.model.listModel.isLoading ) {
            $scope.model.listModel.onList( true );
          }
        };

        $scope.toggleReportTypeDropdown = function() {
          $element.find( '.report-dropdown' ).find( '.dropdown-menu' ).toggle();
        };

        $scope.getReport = function( format ) {
          $scope.model.listModel.onReport( format ).then( function() {
            saveAs( $scope.model.listModel.reportBlob, $scope.model.listModel.reportFilename );
          } );
          $scope.toggleReportTypeDropdown();
        };

        $scope.addRecord = function() {
          if( $scope.model.getAddEnabled() ) $scope.model.listModel.transitionOnAdd();
        };

        $scope.deleteRecord = function( record ) {
          if( $scope.model.getDeleteEnabled() ) {
            if( 0 > $scope.isDeleting.indexOf( record.id ) ) $scope.isDeleting.push( record.id );
            var index = $scope.isDeleting.indexOf( record.id );
            $scope.model.listModel.onDelete( record ).finally(
              function() { if( 0 <= index ) $scope.isDeleting.splice( index, 1 ); }
            );
          }
        };

        $scope.chooseRecord = function( record ) {
          if( $scope.model.getChooseEnabled() ) {
            if( $scope.model.listModel.chooseMode ) {
              // record.chosen shows in the list which record is selected
              record.chosen = record.chosen ? 0 : 1;
              // record.chosenNow keeps track of which records to apply if the changes are committed
              record.chosenNow = record.chosen;
            }
          }
        };

        $scope.selectRecord = function( record ) {
          if( $scope.model.getViewEnabled() ) {
            $scope.model.listModel.onSelect( record );
          }
        };

        $scope.applyChosenRecords = function() {
          if( $scope.model.getChooseEnabled() ) {
            if( $scope.model.listModel.chooseMode ) {
              $scope.applyingChoose = true;
              $scope.model.listModel.onApplyChosen().finally( function() { $scope.applyingChoose = false; } );
            }
          }
        };
      },
      link: function( scope, element, attrs ) {
        if( angular.isUndefined( scope.model ) ) {
          console.error( 'Cannot render cn-record-list, no model provided.' );
        } else {
          scope.$state = $state;
          scope.collapsed = scope.initCollapsed;
          scope.isDeleting = [];

          // watch the model's heading in case it changes
          scope.$watch( 'model.listModel.heading', function( heading ) {
            scope.heading = heading ? heading : scope.model.module.name.singular.ucWords() + ' List';
          } );

          // add site to removeColumns if role doesn't allow for all sites
          var removeColumns = angular.isDefined( scope.removeColumns ) ? scope.removeColumns.split( ' ' ) : []
          if( !CnSession.role.allSites && 0 > removeColumns.indexOf( 'site' ) ) removeColumns.push( 'site' );
          scope.dataArray = scope.model.getDataArray( removeColumns, 'list' );

          scope.setRestrictList = function( key ) {
            var column = scope.dataArray.findByProperty( 'key', key );
            CnModalRestrictFactory.instance( {
              name: scope.model.module.name,
              column: column.title,
              type: column.type,
              restrictList: angular.copy( scope.model.listModel.columnRestrictLists[key] )
            } ).show().then( function( restrictList ) {
              scope.model.listModel.setRestrictList( key, restrictList );
            } );
          };

          scope.removeRestrictList = function( key ) {
            var column = scope.dataArray.findByProperty( 'key', key );
            scope.model.listModel.setRestrictList( key, [] );
          };

          // get the total number of columns in the table
          scope.numColumns = scope.dataArray.length;
        }
      }
    };
  }
] );

/* ######################################################################################################## */

/**
 * A form for editing an existing record's details
 * @attr model: An instance of the subject's model
 * @attr removeInputs: An array of inputs (by key) to remove from the form
 */
cenozo.directive( 'cnRecordView', [
  'CnModalDatetimeFactory', 'CnSession', 'CnHttpFactory', '$state', '$filter',
  function( CnModalDatetimeFactory, CnSession, CnHttpFactory, $state, $filter ) {
    return {
      templateUrl: cenozo.getFileUrl( 'cenozo', 'record-view.tpl.html' ),
      restrict: 'E',
      scope: {
        model: '=',
        footerAtTop: '@',
        removeInputs: '@',
        initCollapsed: '@'
      },
      controller: function( $scope ) {
        $scope.directive = 'cnRecordView';
        $scope.isComplete = false;
        $scope.model.viewModel.onView().then( function() {
          if( 'view' == $scope.model.getActionFromState() ) $scope.model.setupBreadcrumbTrail();

          // build enum lists
          for( var key in $scope.model.metadata.columnList ) {
            // find the input in the dataArray groups
            $scope.dataArray.forEach( function( group ) {
              group.inputArray.filter( function( input ) {
                return input.key == key;
              } ).forEach( function( input ) {
                if( null != input && 0 <= ['boolean', 'enum', 'rank'].indexOf( input.type ) ) {
                  input.enumList = 'boolean' === input.type
                                 ? [ { value: true, name: 'Yes' }, { value: false, name: 'No' } ]
                                 : angular.copy( $scope.model.metadata.columnList[key].enumList );
                  // add the empty option if input is not required
                  if( angular.isArray( input.enumList ) && !$scope.model.metadata.columnList[key].required )
                    if( null == input.enumList.findByProperty( 'name', '(empty)' ) )
                      input.enumList.unshift( { value: '', name: '(empty)' } );
                }
              } );
            } );
          }
        } ).finally( function() { $scope.isComplete = true; } );

        $scope.refresh = function() {
          if( $scope.isComplete ) {
            $scope.isComplete = false;
            $scope.model.viewModel.onView().finally( function() { $scope.isComplete = true } );
          }
        };

        $scope.getReport = function( format ) {
          $scope.model.viewModel.onReport( format ).then( function() {
            saveAs( $scope.model.viewModel.reportBlob, $scope.model.viewModel.reportFilename );
          } );
        };

        $scope.hasParent = function() { return angular.isDefined( $scope.model.module.identifier.parent ); }

        $scope.parentExists = function( subject ) {
          if( !$scope.hasParent() ) return false;
          var parent = $scope.model.module.identifier.parent.findByProperty( 'subject', subject );
          if( null === parent ) return false;
          return $scope.model.viewModel.record[parent.alias];
        };

        $scope.parentName = function( subject ) {
          return subject.replace( /_/g, ' ' ).ucWords();
        };

        $scope.viewParent = function( subject ) {
          $scope.model.viewModel.transitionOnViewParent( subject );
        };

        $scope.delete = function() {
          $scope.isDeleting = true;
          if( $scope.model.getDeleteEnabled() ) {
            $scope.model.viewModel.onDelete().then( function() {
              $scope.model.viewModel.transitionOnDelete();
            } ).finally( function() { $scope.isDeleting = false; } );
          }
        };

        $scope.undo = function( property ) {
          if( $scope.model.getEditEnabled() ) {
            if( $scope.model.viewModel.record[property] != $scope.model.viewModel.backupRecord[property] ) {
              $scope.model.viewModel.record[property] = $scope.model.viewModel.backupRecord[property];
              if( angular.isDefined( $scope.model.viewModel.backupRecord['formatted_'+property] ) ) {
                $scope.model.viewModel.formattedRecord[property] =
                  $scope.model.viewModel.backupRecord['formatted_'+property];
              }
              $scope.patch( property );
            }
          }
        };

        $scope.patch = function( property ) {
          if( $scope.model.getEditEnabled() ) {
            var element = cenozo.getFormElement( property );
            var valid = $scope.model.testFormat( property, $scope.model.viewModel.record[property] );

            if( element ) {
              element.$error.format = !valid;
              cenozo.updateFormElement( element, true );
            }

            if( valid ) {
              // convert size types and write record property from formatted record
              var input = null;
              $scope.dataArray.some( function( group ) {
                input = group.inputArray.findByProperty( 'key', property );
                if( null != input ) return true;
              } );
              if( null != input && 'size' == input.type )
                $scope.model.viewModel.record[property] =
                  $filter( 'cnSize' )( $scope.model.viewModel.formattedRecord[property].join( ' ' ), true );

              // validation passed, proceed with patch
              var data = {};
              data[property] = $scope.model.viewModel.record[property];

              $scope.model.viewModel.onPatch( data ).then( function() {
                // if the data in the identifier was patched then reload with the new url
                if( 0 <= $scope.model.viewModel.record.getIdentifier().split( /[;=]/ ).indexOf( property ) ) {
                  $scope.model.setQueryParameter( 'identifier', $scope.model.viewModel.record.getIdentifier() );
                  $scope.model.reloadState();
                } else {
                  var currentElement = cenozo.getFormElement( property );
                  if( currentElement ) {
                    if( currentElement.$error.conflict ) {
                      cenozo.forEachFormElement( 'form', function( element ) {
                        element.$error.conflict = false;
                        cenozo.updateFormElement( element, true );
                      } );
                    }
                  }

                  // update the formatted value
                  $scope.model.viewModel.updateFormattedRecord( property );
                }
              } );
            }
          }
        };

        $scope.onEmptyTypeahead = function( property ) {
          $scope.model.metadata.getPromise().then( function() {
            // if the input isn't required then set the value to null
            if( !$scope.model.metadata.columnList[property].required ) {
              $scope.model.viewModel.record[property] = null;
              $scope.patch( property );
            }
          } );
        };

        $scope.getTypeaheadValues = function( input, viewValue ) {
          return $scope.model.getEditEnabled() ? $scope.model.getTypeaheadValues( input, viewValue ) : []
        };

        $scope.onSelectTypeahead = function( input, $item, $model, $label ) {
          if( $scope.model.getEditEnabled() ) {
            if( 'lookup-typeahead' == input.type ) {
              $scope.model.viewModel.formattedRecord[input.key] = $label;
              $scope.model.viewModel.record[input.key] = $model;
            } else {
              $scope.model.viewModel.record[input.key] = $item;
            }
            $scope.patch( input.key );
          }
        };

        $scope.selectDatetime = function( input ) {
          if( $scope.model.getEditEnabled() ) {
            $scope.model.metadata.getPromise().then( function() {
              CnModalDatetimeFactory.instance( {
                title: input.title,
                date: $scope.model.viewModel.record[input.key],
                minDate: angular.isDefined( $scope.model.viewModel.record[input.min] ) ?
                         $scope.model.viewModel.record[input.min] : input.min,
                maxDate: angular.isDefined( $scope.model.viewModel.record[input.max] ) ?
                         $scope.model.viewModel.record[input.max] : input.max,
                pickerType: input.type,
                emptyAllowed: !$scope.model.metadata.columnList[input.key].required
              } ).show().then( function( response ) {
                if( false !== response ) {
                  $scope.model.viewModel.record[input.key] = response;
                  $scope.patch( input.key );
                }
              } );
            } );
          }
        };

        $scope.onGroupClick = function( group, index ) {
          // toggle the group's collapsed state
          group.collapsed = !group.collapsed;
          // trigger all elastic directives
          if( !group.collapsed ) angular.element( 'textarea[cn-elastic]' ).trigger( 'change' )
        };
      },
      link: function( scope, element, attrs ) {
        if( angular.isUndefined( scope.model ) ) {
          console.error( 'Cannot render cn-record-view, no model provided.' );
        } else {
          scope.$state = $state;
          scope.collapsed = scope.initCollapsed;
          scope.isDeleting = false;

          // watch the model's heading in case it changes
          scope.$watch( 'model.viewModel.heading', function( heading ) {
            scope.heading = heading ? heading : scope.model.module.name.singular.ucWords() + ' Details';
          } );

          if( angular.isDefined( attrs.viewTitle ) ) {
            scope.viewTitle = attrs.viewTitle;
          } else {
            scope.viewTitle = angular.isDefined( scope.model.viewTitle )
                            ? scope.model.viewTitle
                            : 'View ' + scope.model.module.name.singular.ucWords() + ' List';
          }

          // watch the model's viewTitle in case it changes
          scope.$watch( 'model.viewTitle', function( viewTitle ) {
            scope.viewTitle = angular.isDefined( viewTitle )
                            ? viewTitle
                            : 'View ' + scope.model.module.name.singular.ucWords() + ' List';
          } );

          // when leaving turn off any activated toggle modes
          scope.$on( '$stateChangeStart', function( event, toState, toParams, fromState, fromParams ) {
            if( angular.isDefined( scope.model.viewModel ) ) {
              scope.model.module.choosing.forEach( function( item ) {
                var choosingModel = scope.model.viewModel[item.subject.camel+'Model'];
                if( angular.isDefined( choosingModel ) && choosingModel.listModel.chooseMode )
                  choosingModel.listModel.toggleChooseMode();
              } );
            }
          } );

          var removeInputs = angular.isDefined( scope.removeInputs ) ? scope.removeInputs.split( ' ' ) : []
          scope.dataArray = scope.model.getDataArray( removeInputs, 'view' );
        }
      }
    };
  }
] );

/* ######################################################################################################## */

/**
 * Optional target attribute added to element
 */
cenozo.directive( 'cnTarget',
  function() {
    return {
      restrict: 'A',
      scope: { cnTarget: '=' },
      link: function( scope, element, attrs ) {
        if( angular.isDefined( scope.cnTarget ) ) element[0].target = scope.cnTarget;
      }
    }
  }
);

/* ######################################################################################################## */

/**
 * Displays a running timer
 */
cenozo.directive( 'cnTimer', [
  '$interval',
  function( $interval ) {
    return {
      restrict: 'E',
      template: '{{ dayStr ? dayStr + " " : "" }}' +
                '{{ timeSign ? timeSign + " " : "" }}' +
                '{{ hourStr ? hourStr + ":" : "" }}' +
                '{{ minuteStr }}:{{ secondStr }}',
      scope: {
        since: '@',
        allowNegative: '='
      },
      controller: function( $scope ) { $scope.directive = 'cnTimer'; },
      link: function( scope, element ) {
        function tick() {
          scope.duration.add( 1, 'second' );
          var days = Math.floor( scope.duration.asDays() );
          var negative = 0 > days;
          scope.timeSign = 0 > days ? "-" : "+";
          if( 0 > days ) days++; // adjust for negative durations

          if( 0 == days ) {
            scope.dayStr = "";
            if( "+" == scope.timeSign ) scope.timeSign = "";
          } else {
            scope.dayStr = days + ( 1 == Math.abs( days ) ? " day" : " days" );
          }
          scope.hourStr = Math.abs( scope.duration.hours() );
          scope.minuteStr = Math.abs( scope.duration.minutes() );
          if( 10 > scope.minuteStr ) scope.minuteStr = '0' + scope.minuteStr;
          scope.secondStr = Math.abs( scope.duration.seconds() );
          if( 10 > scope.secondStr ) scope.secondStr = '0' + scope.secondStr;
        }

        scope.duration = moment.duration( moment().diff( moment( scope.since ) ) );

        // adjust for negative
        var seconds = Math.floor( scope.duration.asSeconds() );
        if( false === scope.allowNegative && 0 > seconds ) scope.duration.subtract( seconds+1, 'second' );

        tick();
        var promise = $interval( tick, 1000 );
        element.on( '$destroy', function() { $interval.cancel( promise ); } );
      }
    };
  }
] );

/* ######################################################################################################## */

/**
 * A tree directive
 */
cenozo.directive( 'cnTree',
  function() {
    return {
      templateUrl: cenozo.getFileUrl( 'cenozo', 'tree.tpl.html' ),
      restrict: 'E',
      scope: { model: '=' },
      controller: function( $scope ) { $scope.directive = 'cnTree'; }
    };
  }
);

/* ######################################################################################################## */

/**
 * Used by the tree directive
 */
cenozo.directive( 'cnTreeBranch', [
  'CnRecursionHelper',
  function( CnRecursionHelper ) {
    return {
      templateUrl: cenozo.getFileUrl( 'cenozo', 'tree-branch.tpl.html' ),
      restrict: 'E',
      scope: { model: '=', last: '=' },
      controller: function( $scope ) {
        $scope.directive = 'cnTreeBranch';
        $scope.toggleBranch = function( id ) { $scope.model.open = !$scope.model.open; };
      },
      compile: function( element ) {
        // Use the compile function from the CnRecursionHelper,
        // And return the linking function(s) which it returns
        return CnRecursionHelper.compile( element );
      }
    };
  }
] );

/* ######################################################################################################## */

/**
 * Adds an item to a list
 * Usage: myList|cnAddItem:"hello"
 *   This will add a value to the front or end of a list
 *   Note, for adding objects use ng-init, for example: ng-init="obj={'value':10,'name':'hello'}"
 * 
 * @param mixed item The item to add to the list
 * @param boolean front Whether to add the item to the front or end of the list (default end)
 */
cenozo.filter( 'cnAddItem', function() {
  return function( input, item, front ) {
    if( angular.isArray( input ) ) {
      if( angular.isUndefined( front ) ) front = false;
      if( front ) input.unshift( item ); else input.push( item );
    }
    return input;
  };
} );

/* ######################################################################################################## */

/**
 * Filters a listof objects based on a property's value
 * Usage: myList|cnByObjectProperty:'active':true
 *   This will only show objects in myList which have a property "active" equal to true
 * 
 * @param string prop The object's property to compare
 * @param mixed value The value to compare to
 */
cenozo.filter( 'cnByObjectProperty', function() {
  return function( input, prop, value ) {
    return angular.isArray( input ) ?
      input.filter( function( object ) { return value == object[prop]; } ) : input;
  };
} );

/* ######################################################################################################## */

/**
 * A filter that adds commas to large integers
 */
cenozo.filter( 'cnCommaInteger', function() {
  return function( input ) {
    return parseInt( input ).toString().replace( /\B(?=(\d{3})+(?!\d))/g, ',' );
  };
} );

/* ######################################################################################################## */

/**
 * A filter that displays comparitors as HTML encodings
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
 * Formats datetimes
 */
cenozo.filter( 'cnDatetime', [
  'CnSession',
  function( CnSession ) {
    return function( input, format ) {
      var output;
      if( angular.isUndefined( input ) || null === input ) {
        output = '(empty)';
      } else {
        if( 'moment' != cenozo.getType( input ) ) {
          if( /^[0-9][0-9]?:[0-9][0-9](:[0-9][0-9])?/.test( input ) )
            // no Z at the end since we are converting a time
            input = moment().format( 'YYYY-MM-DD' ) + 'T' + input + 'Z';
          input = moment( new Date( input ) );
        }
        if( 'date' != format && cenozo.isDatetimeType( format, 'timezone' ) ) input.tz( CnSession.user.timezone );
        output = input.format( CnSession.getDatetimeFormat( format, false ) );
      }
      return output;
    };
  }
] );

/* ######################################################################################################## */

/**
 * Determines whether the input is an array
 */
cenozo.filter( 'cnIsArray', [
  '$filter',
  function( $filter ) {
    return function( value ) {
      return angular.isArray( value );
    };
  }
] );

/* ######################################################################################################## */

/**
 * A meta filter used to apply dynamic filters on a value
 */
cenozo.filter( 'cnMetaFilter', [
  '$filter',
  function( $filter ) {
    return function( value, filterStr ) {
      if( angular.isDefined( filterStr ) && 0 < filterStr.length ) {
        // convert string into array deliminating by : (but not inside double quotes)
        var args = [].concat.apply( [], filterStr.split( '"' ).map(
          function( item, index ) { return index%2 ? item : item.split( ':' ) }
        ) ).filter( Boolean );

        var filter = $filter( args.shift() );
        args.unshift( value );
        return filter.apply( null, args );
      } else {
        return angular.isUndefined( value ) || null === value ? '(empty)' : value;
      }
    };
  }
] );

/* ######################################################################################################## */

/**
 * Replaces newlines with HTML line breaks <br>
 */
cenozo.filter( 'cnNewlines', function () {
  return function( text ) { return text.replace( /\r?\n/g, '<br/>' ); }
} );

/* ######################################################################################################## */

/**
 * Adds numeral postfixes for rankings (1st, 2nd, 3rd, etc)
 */
cenozo.filter( 'cnOrdinal', function() {
  return function( input ) {
    var output = input;
    if( angular.isUndefined( input ) || null === input || '' === input ) output = 'none';
    else {
      if( 'string' == cenozo.getType( input ) ) input = parseInt( input );
      if( 'number' == cenozo.getType( input ) ) {
        input = Math.floor( input );
        var postfixList = [ 'th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th' ];
        var modulo = input % 100;
        if( 11 <= modulo && modulo <= 13 ) return input + 'th';
        output += postfixList[input % 10];
      }
    }
    return output;
  }
} );

/* ######################################################################################################## */

/**
 * A filter for percentages
 */
cenozo.filter( 'cnPercent', function() {
  return function( input ) {
    var output = input;
    if( angular.isUndefined( input ) || null === input || '' === input ) output = 'none';
    else {
      if( 'string' == cenozo.getType( input ) ) input = parseInt( input );
      if( 'number' == cenozo.getType( input ) ) output = input + '%';
    }
    return output;
  };
} );

/* ######################################################################################################## */

/**
 * Returns an array from min to max, incremented by 1
 */
cenozo.filter( 'cnRange', function() {
  return function( input, min, max ) {
    min = parseInt( min );
    max = parseInt( max );
    for( var i = min; i <= max; i++ ) input.push( i );
    return input;
  };
} );

/* ######################################################################################################## */

/**
 * Filters restrictions into restriction types
 */
cenozo.filter( 'cnRestrictType', function() {
  return function( input ) {
    if( cenozo.isDatetimeType( input ) ) input = 'datetime';
    return input;
  };
} );

/* ######################################################################################################## */

/**
 * Filters numbers into bit sizes (or bit sizes into numbers)
 */
cenozo.filter( 'cnSize', function() {
  return function( input, reverse ) {
    var output = input;
    if( angular.isUndefined( reverse ) ) reverse = false;
    if( angular.isUndefined( input ) || null === input || '' === input ) output = 'empty';
    else {
      var type = cenozo.getType( input );
      if( reverse ) {
        if( 'string' == type ) {
          var parts = input.split( ' ' );
          if( 2 == parts.length ) {
            output = parts[0];
            var unit = parts[1];
            if( 'KB' == unit ) output *= 1024;
            if( 'MB' == unit ) output *= 1048576;
            if( 'GB' == unit ) output *= 1073741824;
            if( 'TB' == unit ) output *= 1099511627776;
            if( 'PB' == unit ) output *= 1125899906842624;
            if( 'EB' == unit ) output *= 1152921504606846976;
          }
        }
      } else {
        if( 'string' == type ) input = parseInt( input );
        if( 'number' == type ) {
          var unitList = [ 'Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB' ];
          var unitIndex = 0;
          while( output >= 1024 ) {
            output /= 1024;
            unitIndex++;
          }
          output = ( Math.round( output*100 ) / 100 ) + ' ' + unitList[unitIndex];
        }
      }
    }
    return output;
  };
} );

/* ######################################################################################################## */

/**
 * A filter that crops long strings to the given maximum length
 * 
 * @param integer max The maximum length a string can get before cropping it
 */
cenozo.filter( 'cnStub', function() {
  return function( input, limit ) {
    if( null == input ) return '(empty)';
    else return limit < String( input ).length ? input.substr( 0, limit-1 ).trim() + '...' : input;
  };
} );

/* ######################################################################################################## */

/**
 * A filter that capitolizes the first letter of every word
 */
cenozo.filter( 'cnUCWords', function() {
  return function( input ) {
    if( 'string' == cenozo.getType( input ) )
      input = input.replace( /(?:^|\s)\S/g, function( a ) { return angular.uppercase( a ); } );
    return input;
  };
} );

/* ######################################################################################################## */

/**
 * A filter that returns all unique items in an array
 */
cenozo.filter( 'cnUnique', function() {
  return function( input ) {
    return angular.isArray( input ) ? input.getUnique() : input;
  };
} );

/* ######################################################################################################## */

/**
 * Filters views into view types
 */
cenozo.filter( 'cnViewType', function() {
  return function( input ) {
    if( 'boolean' == input || 'enum' == input || 'rank' == input ) input = 'select';
    else if( cenozo.isDatetimeType( input ) ) input = 'datetime';
    return input;
  };
} );

/* ######################################################################################################## */

/**
 * Filters values into "Yes" or "No"
 */
cenozo.filter( 'cnYesNo', function() {
  return function( input ) {
    if( null === input ) return '(empty)';
    if( "boolean" != cenozo.getType( input ) ) input = 0 != input;
    return input ? 'yes' : 'no';
  };
} );

/* ######################################################################################################## */

/**
 * Exception handler that will redirect the user to a 400 page
 */
cenozo.factory( '$exceptionHandler', [
  '$window',
  function( $window ) {
    return function( exception, cause ) {
      // report the exception to the console and replace the view's inner html with a notification of the error
      console.error( '%s', exception );
      if( angular.isDefined( cause ) ) console.warn( '%s', cause );
      document.getElementById( 'view' ).innerHTML =
        '<div class="inner-view-frame">\n' +
          '<div class="container-fluid bg-white">\n' +
            '<h3 class="text-primary">User Interface Error</h3>\n' +
            '<div class="container-fluid">\n' +
              '<blockquote>\n' +
                'Sorry, the client has experienced a user-interface error.\n' +
                'Please <a onclick="window.location.reload(true)">reload</a> the page or\n' +
                '<a onclick="window.history.back()">go back</a> to the previous page.\n' +
                '<h4 class="text-warning">Error: ' + exception.message + '</h4>\n' +
              '</blockquote>\n' +
            '</div>\n' +
          '</div>\n' +
        '</div>\n' +
        '<div class="gradient-footer"></div>\n';
    };
  }
] );

/* ######################################################################################################## */

/**
 * The session factory
 */
cenozo.factory( 'CnSession', [
  '$state', '$timeout', '$filter', '$window', '$interval', 'CnHttpFactory',
  'CnModalMessageFactory', 'CnModalPasswordFactory', 'CnModalAccountFactory', 'CnModalSiteRoleFactory',
  function( $state, $timeout, $filter, $window, $interval, CnHttpFactory,
            CnModalMessageFactory, CnModalPasswordFactory, CnModalAccountFactory, CnModalSiteRoleFactory ) {
    return new ( function() {
      var self = this;
      this.pageTitle = '';
      this.promise = null;
      this.working = false;
      this.workingGUIDList = {};
      this.transitionWhileWorking = false;
      this.application = {};
      this.user = {};
      this.site = {};
      this.role = {};
      this.setting = {};
      this.siteList = [];
      this.moduleList = [];
      this.sessionList = [];
      this.messageList = [];
      this.unreadMessageCount = 0;
      this.breadcrumbTrail = [];
      this.alertHeader = undefined;
      this.onAlertHeader = function() {};
      this.scriptWindowHandler = null;

      // handle watching of http requests that take a long time to return
      var workingPromise = null;
      function watchWorkingCount() {
        workingPromise = null;
        if( 0 < Object.keys( self.workingGUIDList ).length ) {
          self.working = true;
        }
      }

      angular.extend( this, {
        updateWorkingGUID: function( guid, start ) {
          if( start ) {
            if( !angular.isDefined( this.workingGUIDList[guid] ) ) this.workingGUIDList[guid] = 0;
            this.workingGUIDList[guid]++;
          } else if( angular.isDefined( this.workingGUIDList[guid] ) ) {
            this.workingGUIDList[guid]--;
            if( 0 == this.workingGUIDList[guid] ) delete this.workingGUIDList[guid];
          }

          if( 0 < Object.keys( this.workingGUIDList ).length ) {
            if( null === workingPromise ) workingPromise = $timeout( watchWorkingCount, 1000 );
          } else {
            this.working = false;
            // reset the transitionWhileWorking property after a short wait so that any pending
            // transitions can be ignored before the property is reset
            $timeout( function() { self.transitionWhileWorking = false; }, 200 );
            if( null !== workingPromise ) {
              $timeout.cancel( workingPromise );
              workingPromise = null;
            }
          }
        },

        // wrapping all state transitions with option to cancel
        workingTransition: function( transitionFn ) {
          var transition = !this.transitionWhileWorking;
          this.transitionWhileWorking = false;
          return transition ? transitionFn() : null;
        },

        // defines the breadcrumbtrail based on an array of crumbs
        setBreadcrumbTrail: function( crumbs ) {
          this.breadcrumbTrail.length = 0;
          this.breadcrumbTrail.push( { title: 'Home', go: function() { return $state.go( 'root.home' ); } } );
          if( angular.isArray( crumbs ) )
            crumbs.forEach( function( item ) { this.breadcrumbTrail.push( item ); }, this );
        },

        countUnreadMessages: function() {
          self.unreadMessageCount = this.messageList.filter( function( message ) {
            return message.unread;
          } ).length;
        },

        getSystemMessages: function() {
          CnHttpFactory.instance( {
            path: 'self/0/system_message?no_activity=1',
            data: { select: { column: [ 'id', 'title', 'note', 'unread' ] } }
          } ).get().then( function( response ) {
            // get message list and count how many unread messages there are
            self.messageList = angular.copy( response.data );
            self.countUnreadMessages();
          } );
        },

        // get the application, user, site and role details
        updateData: function() {
          self.getSystemMessages();
          this.promise = CnHttpFactory.instance( {
            path: 'self/0',
            redirectOnError: true
          } ).get().then( function( response ) {
            for( var property in response.data.application )
              self.application[property.snakeToCamel()] = response.data.application[property];
            for( var property in response.data.user )
              self.user[property.snakeToCamel()] = response.data.user[property];
            for( var property in response.data.site )
              self.site[property.snakeToCamel()] = response.data.site[property];
            for( var property in response.data.setting )
              self.setting[property.snakeToCamel()] = response.data.setting[property];
            for( var property in response.data.role )
              self.role[property.snakeToCamel()] = response.data.role[property];

            // initialize the http factory so that all future requests match the same credentials
            CnHttpFactory.initialize( self.site.name, self.user.name, self.role.name );

            // sanitize the timezone
            if( !moment.tz.zone( self.user.timezone ) ) self.user.timezone = 'UTC';

            // process site records
            self.siteList = response.data.site_list;
            self.siteList.forEach( function( site ) {
              site.getIdentifier = function() { return 'name=' + this.name; };
            } );

            // process module list
            self.moduleList = response.data.module_list;

            // add the withdraw script id
            self.withdrawScript = response.data.withdraw_script;

            // process session records
            self.sessionList = response.data.session_list;

            // if the user's password isn't set then open the password dialog
            if( response.data.no_password && !CnModalPasswordFactory.isOpen() ) {
              CnModalPasswordFactory.instance( { confirm: false } ).show().then( function( response ) {
                self.setPassword( null, response.requestedPass );
              } );
            }

            // if the user's email isn't set then open the password dialog
            if( !self.user.email && !CnModalAccountFactory.isOpen() ) {
              CnModalAccountFactory.instance( {
                allowCancel: false,
                user: self.user
              } ).show().then( function( response ) {
                if( response ) self.setUserDetails();
              } );
            }

            // if voip is enabled the load the voip data
            self.voip = { enabled: false, info: false };
            if( self.application.voipEnabled ) self.updateVoip();
          } );

          return this.promise;
        },

        // get the application, user, site and role details
        updateVoip: function() {
          return CnHttpFactory.instance( {
            path: 'voip/0'
          } ).get().then( function( response ) {
            self.voip = response.data;
          } );
        },

        logout: function() {
          // blank content
          document.getElementById( 'view' ).innerHTML = '';
          CnHttpFactory.instance( {
            path: 'self/0'
          } ).delete().then( function() {
            // blank content
            document.getElementById( 'view' ).innerHTML = '';
            $window.location.assign( cenozoApp.baseUrl );
          } );
        },

        setPassword: function( currentPass, requestedPass ) {
          return CnHttpFactory.instance( {
            path: 'self/0',
            data: { user: { password: { current: currentPass, requested: requestedPass } } },
            onError: function( response ) {
              if( 400 == response.status && 'invalid password' == response.data ) {
                CnModalMessageFactory.instance( {
                  title: 'Unable To Change Password',
                  message: 'Sorry, the current password you provided is incorrect, please try again. ' +
                           'If you have forgotten your current password an administrator can reset it.',
                  error: true
                } ).show();
              } else { CnModalMessageFactory.httpError( response ); }
            }
          } ).patch().then( function() {
            CnModalMessageFactory.instance( {
              title: 'Password Changed',
              message: 'Your password has been successfully changed.'
            } ).show();
          } );
        },

        showSiteRoleModal: function() {
          CnModalSiteRoleFactory.instance( {
            siteId: this.site.id,
            roleId: this.role.id
          } ).show().then( function( response ) {
            if( angular.isObject( response ) &&
                ( response.siteId != self.site.id || response.roleId != self.role.id ) ) {
              // show a waiting screen while we're changing the site/role
              $state.go( 'self.wait' ).then( function() {
                CnHttpFactory.instance( {
                  path: 'self/0',
                  data: { site: { id: response.siteId }, role: { id: response.roleId } }
                } ).patch().then( function() {
                  // blank content
                  $window.location.assign( cenozoApp.baseUrl );
                } );
              } );
            }
          } );
        },

        setUserDetails: function() {
          return CnHttpFactory.instance( {
            path: 'self/0',
            data: {
              user: {
                first_name: self.user.firstName,
                last_name: self.user.lastName,
                email: self.user.email
              }
            }
          } ).patch();
        },

        getTimeFormat: function( seconds, timezone ) {
          if( angular.isUndefined( seconds ) ) seconds = false;
          if( angular.isUndefined( timezone ) ) timezone = false;
          return ( self.user.use12hourClock ? 'h' : 'H' ) +
                 ':mm' +
                 ( seconds ? ':ss' : '' ) +
                 ( self.user.use12hourClock ? 'a' : '' ) +
                 ( timezone ? ' z' : '' );
        },

        getDatetimeFormat: function( format, longForm ) {
          if( angular.isUndefined( longForm ) ) longForm = false;
          var resolvedFormat = format;
          if( 'dob' == format ) {
            resolvedFormat = 'MMM D, YYYY';
          } else if( cenozo.isDatetimeType( format, 'date' ) ) {
            resolvedFormat = ( longForm ? 'dddd, MMMM Do' : 'MMM D' ) + ', YYYY';
            if( 'date' != format )
              resolvedFormat += ' @ ' + this.getTimeFormat( cenozo.isDatetimeType( format, 'second' ), longForm );
          } else if( cenozo.isDatetimeType( format, 'time' ) ) {
            resolvedFormat = this.getTimeFormat( cenozo.isDatetimeType( format, 'second' ), false );
          }
          return resolvedFormat;
        },

        updateTime: function() {
          var now = moment();
          now.tz( self.user.timezone );
          self.time = now.format( self.getTimeFormat( false, true ) );
        },

        setTimezone: function( timezone, use12hourClock ) {
          if( angular.isUndefined( timezone ) ) timezone = self.user.timezone;
          if( angular.isUndefined( use12hourClock ) ) use12hourClock = self.user.use12hourClock;
          return CnHttpFactory.instance( {
            path: 'self/0',
            data: { user: { timezone: timezone, use_12hour_clock: use12hourClock  } }
          } ).patch();
        },

        formatValue: function( value, type, longForm ) {
          if( angular.isUndefined( longForm ) ) longForm = false;
          var formatted = value;
          if( null === value ) {
            formatted = '(empty)';
          } else if( 'string' == type && '' === value ) {
            formatted = '(empty string)';
          } else if( 'text' == type && '' === value ) {
            formatted = '(empty text)';
          } else if( 'boolean' == type ) {
            formatted = $filter( 'cnYesNo' )( value );
          } else if( cenozo.isDatetimeType( type ) ) {
            if( 'moment' != cenozo.getType( value ) ) {
              if( angular.isUndefined( value ) ) value = moment();
              else {
                if( /^[0-9][0-9]?:[0-9][0-9](:[0-9][0-9])?/.test( value ) ) {
                  // no Z at the end since we are converting a time
                  value = moment().format( 'YYYY-MM-DD' ) + 'T' + value + 'Z';
                }
                value = moment( new Date( value ) );
              }
            }
            if( cenozo.isDatetimeType( type, 'timezone' ) ) value.tz( this.user.timezone );
            formatted = value.format( this.getDatetimeFormat( type, longForm ) );
            // add the current age for dobs
            if( 'dob' == type ) {
              var age = moment().diff( value, 'years' );
              formatted += ' (' + age + ' year' + ( 1 == age ? '' : 's' ) + ' old)';
            }
          } else if( 'rank' == type ) {
            var number = parseInt( value );
            if( 0 < number ) formatted = $filter( 'cnOrdinal' )( number );
          }
          return formatted;
        },

        describeRestriction: function( type, test, value, unit ) {
          var formattedValue = this.formatValue( value, type, false );
          if( 'string' == type && null !== value && 0 < value.length )
            formattedValue = '"' + formattedValue + '"';
          var formattedUnit = angular.isDefined( unit ) ? ' ' + unit : '';
          return $filter( 'cnComparator' )( test ) + ' ' + formattedValue + formattedUnit;
        },

        closeScript: function() { if( null != this.scriptWindowHandler ) this.scriptWindowHandler.close(); }

      } );

      this.updateData();

      // regularly check for new messages
      $interval( self.getSystemMessages, 300000 );
    } );
  }
] );

/* ######################################################################################################## */

/**
 * The base factory for all module Add factories
 */
cenozo.factory( 'CnBaseAddFactory', [
  'CnSession', 'CnHttpFactory', 'CnModalMessageFactory', '$filter', '$q',
  function( CnSession, CnHttpFactory, CnModalMessageFactory, $filter, $q ) {
    return {
      construct: function( object, parentModel ) {
        object.parentModel = parentModel;
        object.heading = 'Create ' + parentModel.module.name.singular.ucWords();

        /**
         * Add a function to be executed after onAdd is complete
         * 
         * @param function
         */
        object.afterAdd = function( fn ) {
          // make sure the function doesn't already exist
          if( !this.afterAddFunctions.some( function( viewFn ) {
            return fn === viewFn || fn.toString() == viewFn.toString();
          } ) ) this.afterAddFunctions.push( fn );
        };
        object.afterAddFunctions = [];

        /**
         * Sends a new record to the server.
         * 
         * @param object record: The record to add
         * @return promise
         */
        cenozo.addExtendableFunction( object, 'onAdd', function( record ) {
          var self = this;
          if( !this.parentModel.getAddEnabled() ) throw new Error( 'Calling onAdd() but add is not enabled.' );
          var httpObj = { path: this.parentModel.getServiceCollectionPath(), data: record };
          httpObj.onError = function( response ) { self.onAddError( response ); };
          return CnHttpFactory.instance( httpObj ).post().then( function( response ) {
            angular.extend( record, {
              id: response.data,
              getIdentifier: function() { return self.parentModel.getIdentifierFromRecord( record ); }
            } );
            self.afterAddFunctions.forEach( function( fn ) { fn( record ); } );
          } );
        } );

        /**
         * Handles errors when adding records.
         * 
         * @param object response: The response of a failed http call
         */
        cenozo.addExtendableFunction( object, 'onAddError', function( response ) {
          if( 409 == response.status ) {
            // report which inputs are included in the conflict
            response.data.forEach( function( item ) {
              var element = cenozo.getFormElement( item );
              if( element ) {
                element.$error.conflict = true;
                cenozo.updateFormElement( element, true );
              }
            } );
          } else { CnModalMessageFactory.httpError( response ); }
        } );

        /**
         * Add a function to be executed after onNew is complete
         * 
         * @param function
         */
        object.afterNew = function( fn ) {
          // make sure the function doesn't already exist
          if( !this.afterNewFunctions.some( function( viewFn ) {
            return fn === viewFn || fn.toString() == viewFn.toString();
          } ) ) this.afterNewFunctions.push( fn );
        };
        object.afterNewFunctions = [];

        /**
         * Creates a new local record.
         * 
         * @param object record: The object to initialize as a new record
         * @return promise
         */
        cenozo.addExtendableFunction( object, 'onNew', function( record ) {
          var self = this;

          // load the metadata and use it to apply default values to the record
          return this.parentModel.metadata.getPromise().then( function() {
            var promiseList = [];
            if( angular.isDefined( self.parentModel.metadata.columnList.rank ) ) { // create enum for rank columns
              // add the parent subject and identifier to the service path if we are in the view state
              var path = self.parentModel.getServiceCollectionPath();

              promiseList.push( CnHttpFactory.instance( {
                path: path,
                data: { select: { column: {
                  column: 'MAX(' + self.parentModel.module.subject.snake + '.rank)',
                  alias: 'max',
                  table_prefix: false
                } } },
                redirectOnError: true
              } ).query().then( function( response ) {
                if( 0 < response.data.length ) {
                  self.parentModel.metadata.columnList.rank.enumList = [];
                  if( null !== response.data[0].max ) {
                    for( var rank = 1; rank <= parseInt( response.data[0].max ); rank++ ) {
                      self.parentModel.metadata.columnList.rank.enumList.push( {
                        value: rank,
                        name: $filter( 'cnOrdinal' )( rank )
                      } );
                    }
                  }
                }
              } ) );
            }

            // apply default values from the metadata
            for( var column in self.parentModel.metadata.columnList ) {
              if( null !== self.parentModel.metadata.columnList[column].default &&
                  'create_timestamp' != column &&
                  'update_timestamp' != column ) {
                record[column] = 'tinyint' == self.parentModel.metadata.columnList[column].data_type
                               ? 1 == self.parentModel.metadata.columnList[column].default
                               : self.parentModel.metadata.columnList[column].default;
              }
            }

            return $q.all( promiseList ).then( function() {
              self.afterNewFunctions.forEach( function( fn ) { fn(); } );
            } );
          } );
        } );

        /**
         * The state transition to execute after saving a new record
         * 
         * @param object record: The record that was just saved
         */
        cenozo.addExtendableFunction( object, 'transitionOnSave', function( record ) {
          var self = this;
          CnSession.workingTransition( function() { self.parentModel.transitionToLastState( record ); } );
        } );

        /**
         * The state transition to execute after cancelling adding a new record
         */
        cenozo.addExtendableFunction( object, 'transitionOnCancel', function() {
          this.parentModel.transitionToLastState();
        } );
      }
    };
  }
] );

/* ######################################################################################################## */

/**
 * The base factory for all module Calendar factories
 */
cenozo.factory( 'CnBaseCalendarFactory', [
  'CnSession', 'CnHttpFactory', 'CnModalMessageFactory', '$q',
  function( CnSession, CnHttpFactory, CnModalMessageFactory, $q ) {
    return {
      construct: function( object, parentModel ) {
        object.parentModel = parentModel;
        object.heading = parentModel.module.name.singular.ucWords() + ' Calendar';
        object.currentDate = moment();
        object.currentView = 'agendaWeek';
        object.isLoading = false;
        object.cache = [];
        object.cacheMinDate = null;
        object.cacheMaxDate = null;
        object.enableReports = 1 < CnSession.role.tier;
        object.isReportLoading = false;
        object.isReportAllowed = false;
        object.isReportBig = false;
        object.reportBlob = null;
        object.reportFilename = null;

        /**
         * Determines the lower date boundary for which the cache will require given a new minimum date
         */
        object.getLoadMinDate = function( replace, minDate ) {
          return replace ||
                 null == minDate ||
                 null == this.cacheMinDate ||
                 // the requested date span is too far outside the existing one
                 6 < Math.abs( this.cacheMinDate.diff( minDate, 'months' ) ) ||
                 // if the min date comes after the cache's min date then load from the new min date
                 this.cacheMinDate.isAfter( minDate, 'day' )
               ? minDate
               : moment( this.cacheMaxDate ).add( 1, 'days' );
        };

        /**
         * Determines the upper date boundary for which the cache will require given a new maximum date
         */
        object.getLoadMaxDate = function( replace, maxDate ) {
          return replace ||
                 null == maxDate ||
                 null == this.cacheMaxDate ||
                 // the requested date span is too far outside the existing one
                 6 < Math.abs( this.cacheMaxDate.diff( maxDate, 'months' ) ) ||
                 // if the max date comes before the cache's max date then load to the new max date
                 this.cacheMaxDate.isBefore( maxDate, 'day' )
               ? maxDate
               : moment( this.cacheMinDate ).subtract( 1, 'days' );
        };

        /**
         * Add a function to be executed after onDelete is complete
         * 
         * @param function
         */
        object.afterDelete = function( fn ) {
          // make sure the function doesn't already exist
          if( !this.afterDeleteFunctions.some( function( viewFn ) {
            return fn === viewFn || fn.toString() == viewFn.toString();
          } ) ) this.afterDeleteFunctions.push( fn );
        };
        object.afterDeleteFunctions = [];

        /**
         * Deletes an event from the server.
         * 
         * @param object event: The event to delete
         * @return promise
         */
        cenozo.addExtendableFunction( object, 'onDelete', function( record ) {
          var self = this;
          if( !this.parentModel.getDeleteEnabled() )
            throw new Error( 'Calling onDelete() but delete is not enabled.' );

          var httpObj = { path: this.parentModel.getServiceResourcePath( record.getIdentifier() ) };
          httpObj.onError = function( response ) { self.onDeleteError( response ); }
          return CnHttpFactory.instance( httpObj ).delete().then( function() {
            self.afterDeleteFunctions.forEach( function( fn ) { fn(); } );
          } );
        } );

        /**
         * Handles errors when deleting events.
         * 
         * @param object response: The response of a failed http call
         */
        cenozo.addExtendableFunction( object, 'onDeleteError', function( response ) {
          if( 409 == response.status ) {
            CnModalMessageFactory.instance( {
              title: 'Unable to delete ' + this.parentModel.module.name.singular + ' event',
              message: 'It is not possible to delete this ' + this.parentModel.module.name.singular +
                       ' event because it is being referenced by "' + response.data +
                       '" in the database.',
              error: true
            } ).show();
          } else { CnModalMessageFactory.httpError( response ); }
        } );

        /**
         * Loads a report from the server.
         * 
         * @return promise
         */
        cenozo.addExtendableFunction( object, 'onReport', function( format ) {
          var self = this;
          this.isReportLoading = true;
          if( angular.isUndefined( format ) ) format = 'csv';

          // start by getting the data from the parent model using the column restrict lists
          var data = this.parentModel.getServiceData( 'report' );

          // set up the to-from dates
          if( 'agendaDay' == this.currentView ) {
            data.min_date = moment( this.currentDate ).format( 'YYYY-MM-DD' );
            data.max_date = data.min_date;
          } else if( 'agendaWeek' == this.currentView ) {
            data.min_date = moment( this.currentDate ).day( 0 ).format( 'YYYY-MM-DD' );
            data.max_date = moment( this.currentDate ).day( 6 ).format( 'YYYY-MM-DD' );
          } else { // 'month' == this.currentView
            data.min_date = moment( this.currentDate ).date( 1 ).day( 0 ).format( 'YYYY-MM-DD' );
            data.max_date = moment( data.min_date ).add( 5, 'weeks' ).day( 6 ).format( 'YYYY-MM-DD' );
          }

          var httpObj = { path: this.parentModel.getServiceCollectionPath(), data: data };
          httpObj.onError = function( response ) { self.onReportError( response ); }
          httpObj.format = format;
          return CnHttpFactory.instance( httpObj ).query().then( function( response ) {
            self.reportBlob = new Blob(
              [response.data],
              { type: response.headers( 'Content-Type' ).replace( /"(.*)"/, '$1' ) }
            );
            self.reportFilename = response.headers( 'Content-Disposition' ).match( /filename=(.*);/ )[1];
          } ).finally( function() { self.isReportLoading = false; } );
        } );

        /**
         * Handles errors when getting a report.
         * 
         * @param object response: The response of a failed http call
         */
        cenozo.addExtendableFunction( object, 'onReportError', function( response ) {
          CnModalMessageFactory.httpError( response );
        } );

        /**
         * Add a function to be executed after onCalendar is complete
         * 
         * @param function
         */
        object.afterCalendar = function( fn ) {
          // make sure the function doesn't already exist
          if( !this.afterCalendarFunctions.some( function( viewFn ) {
            return fn === viewFn || fn.toString() == viewFn.toString();
          } ) ) this.afterCalendarFunctions.push( fn );
        };
        object.afterCalendarFunctions = [];

        /**
         * Loads events from the server.
         * 
         * This method will cache events, loading event date spans outside of the cache when
         * necessary.  If the requested date span falls too far outside the current cache then
         * the cache will be replaced instead of appended.
         * All events will be stored in this.cache
         * @param boolean replace: Whether to replace the cached list or append to it
         * @param moment minDate: The lower date span to get events for
         * @param moment maxDate: The upper date span to get events for
         * @param boolean ignoreParent: Whether to ignore the parent state and show all events
         * @return promise
         */
        cenozo.addExtendableFunction( object, 'onCalendar', function( replace, minDate, maxDate, ignoreParent ) {
          var self = this;

          // change the parent model's listing state
          this.parentModel.listingState = 'calendar';

          // make sure we get a minimum of 7 days at a time
          if( null != minDate && null != maxDate && 1 >= maxDate.diff( minDate, 'days' ) ) {
            minDate.day( 0 );
            maxDate.day( 6 );
          }

          var query = false;
          var loadMinDate = this.getLoadMinDate( replace, minDate );
          var loadMaxDate = this.getLoadMaxDate( replace, maxDate );

          // If the new min/max date eclipses the cache's min/max date then just replace the cache.
          // This happens when looking at a week and switching to a month
          if( null != loadMinDate && null != loadMaxDate &&
              null != this.cacheMinDate && null != this.cacheMaxDate &&
              loadMinDate.isBefore( this.cacheMinDate, 'day' ) &&
              loadMaxDate.isAfter( this.cacheMaxDate, 'day' ) ) replace = true;

          if( replace || null == this.cacheMinDate || null == this.cacheMaxDate ||
              6 < Math.abs( this.cacheMinDate.diff( minDate, 'months' ) ) ) {
            // rebuild the cache for the requested date span
            this.cache = [];
            this.cacheMinDate = null == loadMinDate ? null : moment( loadMinDate );
            this.cacheMaxDate = null == loadMaxDate ? null : moment( loadMaxDate );
            query = null != minDate && null != maxDate;
          } else if( null != minDate && null != maxDate ) {
            // if the min date comes after the cache's min date then load from the new min date
            if( this.cacheMinDate.isAfter( minDate, 'day' ) ) {
              this.cacheMinDate = moment( minDate );
              query = true;
            }

            // if the max date comes before the cache's max date then load to the new max date
            if( this.cacheMaxDate.isBefore( maxDate, 'day' ) ) {
              this.cacheMaxDate = moment( maxDate );
              query = true;
            }
          }

          var promiseList = [];
          if( query ) {
            var data = this.parentModel.getServiceData( 'calendar' );
            if( angular.isUndefined( data.modifier ) ) data.modifier = {};
            data.min_date = loadMinDate.format( 'YYYY-MM-DD' );
            data.max_date = loadMaxDate.format( 'YYYY-MM-DD' );

            this.isLoading = true;

            var httpObj = {
              path: this.parentModel.getServiceCollectionPath( ignoreParent ),
              data: data
            };
            httpObj.onError = function( response ) { self.onCalendarError( response ); }
            promiseList.push( CnHttpFactory.instance( httpObj ).query().then( function( response ) {
              // add the getIdentifier() method to each row before adding it to the cache
              response.data.forEach( function( item ) {
                item.getIdentifier = function() { return self.parentModel.getIdentifierFromRecord( item ); };
              } );
              self.cache = self.cache.concat( response.data );
              var total = parseInt( response.headers( 'Total' ) );
              self.isReportAllowed = CnSession.application.maxBigReport >= total;
              self.isReportBig = CnSession.application.maxSmallReport < total;
            } ).finally( function() { self.isLoading = false; } ) );
          }

          return $q.all( promiseList ).then( function() {
            self.afterCalendarFunctions.forEach( function( fn ) { fn(); } );
          } );
        } );

        /**
         * Handles errors when listing records.
         * 
         * @param object response: The response of a failed http call
         */
        cenozo.addExtendableFunction( object, 'onCalendarError', function( response ) {
          CnModalMessageFactory.httpError( response );
        } );

        // fullcalendar's settings object, used by the cn-record-calendar directive
        object.settings = {
          defaultDate: object.currentDate,
          defaultView: object.currentView,
          defaultTimedEventDuration: '01:00:00',
          allDaySlot: false,
          firstDay: 0,
          scrollTime: '07:00:00',
          timezone: 'UTC',
          header: {
            left: 'title',
            center: 'today prevYear,prev,next,nextYear',
            right: 'agendaDay,agendaWeek,month'
          },
          events: function( start, end, timezone, callback ) {
            // track the current date
            object.currentDate = this.getDate();

            // call onCalendar to make sure we have the events in the requested date span
            var minDate = moment( start.format( 'YYYY-MM-DD' ) );
            var maxDate = moment( end.format( 'YYYY-MM-DD' ) ).subtract( 1, 'days' );
            object.onCalendar( false, minDate, maxDate ).then( function() {
              if( 'calendar' == object.parentModel.getActionFromState() )
                object.parentModel.setupBreadcrumbTrail();
              callback(
                object.cache.reduce( function( eventList, e ) {
                  if( moment( e.start ).isBefore( end, 'day' ) &&
                      !moment( e.end ).isBefore( start, 'day' ) ) eventList.push( e );
                  return eventList;
                }, [] )
              );
            } );
          },
          eventAfterRender: function( event, element, view ) {
            // add help as a popover
            if( null != event.help ) {
              element.popover( {
                trigger: 'hover',
                content: event.help,
                placement: 'top',
                container: 'body'
              } );
            }
          },
          eventAfterAllRender: function( view ) {
            // track the current view
            object.currentDate = this.calendar.getDate();
            object.currentView = view.name;
          },
          dayClick: function( date, event, view ) {
            // mark which date has been chosen in the add model
            // Note: it is up to the add model's module to implement what to do with this variable
            object.parentModel.addModel.calendarDate = date.format( 'YYYY-MM-DD' );
            return object.parentModel.transitionToAddState();
          },
          eventClick: function( record ) {
            angular.element( this ).popover( 'hide' );
            if( object.parentModel.getViewEnabled() )
              return object.parentModel.transitionToViewState( record );
          }
        };

        /**
         * The state transition to execute after cancelling adding a new record
         */
        cenozo.addExtendableFunction( object, 'transitionOnList', function() {
          this.parentModel.transitionToParentListState();
        } );
      }
    };
  }
] );

/* ######################################################################################################## */

/**
 * The base factory for all module List factories
 */
cenozo.factory( 'CnBaseListFactory', [
  'CnSession', 'CnPaginationFactory', 'CnHttpFactory', 'CnModalMessageFactory', '$q',
  function( CnSession, CnPaginationFactory, CnHttpFactory, CnModalMessageFactory, $q ) {
    return {
      construct: function( object, parentModel ) {
        object.parentModel = parentModel;
        object.heading = parentModel.module.name.singular.ucWords() + ' List';
        object.order = object.parentModel.module.defaultOrder;
        object.total = 0;
        object.minOffset = null;
        object.cache = [];
        object.enableReports = 1 < CnSession.role.tier;
        object.isReportLoading = false;
        object.isReportAllowed = false;
        object.isReportBig = false;
        object.reportBlob = null;
        object.reportFilename = null;
        object.paginationModel = CnPaginationFactory.instance();
        object.isLoading = false;
        object.chooseMode = false;

        // initialize the restrict lists
        object.columnRestrictLists = {};

        cenozo.addExtendableFunction( object, 'orderBy', function( column, reverse ) {
          var self = this;

          if( this.order.column != column || this.order.reverse != reverse ) {
            // We need to determine whether to do state or model based ordering.
            // State-based ordering is used when the state has an {order} parameter and the state's current
            // subject (name) matches the model's queryParameterSubject value (which, by default, is the
            // model's subject).
            // However, queryParameterSubject may be changed in order to customise which model gets to use the
            // state's query parameters.
            // Model-based ordering ignores state parameters and instead stores ordering in the model (internally)
            if( this.parentModel.hasQueryParameter( 'order' ) ) {
              // do state-based sorting
              this.parentModel.setQueryParameter( 'order', column );
              this.parentModel.setQueryParameter( 'reverse', reverse );
              this.parentModel.setQueryParameter( 'page', 1 );
              this.parentModel.reloadState();
            } else {
              // do model-based sorting
              var promiseList = [];
              this.order = { column: column, reverse: reverse };
              if( this.cache.length < this.total ) { promiseList.push( this.onList( true ) ); }
              $q.all( promiseList ).then( function() { self.paginationModel.currentPage = 1; } );
            }
          }
        } );

        cenozo.addExtendableFunction( object, 'setRestrictList', function( column, newList ) {
          var self = this;

          // sanity check
          if( !angular.isArray( newList ) )
            throw new Error( 'Tried to set restrict list for column "' + column + '" to a non-array.' );

          if( !angular.isArray( this.columnRestrictLists[column] ) ) this.columnRestrictLists[column] = [];

          if( !this.columnRestrictLists[column].isEqualTo( newList ) ) {
            // We need to determine whether to do state or model based restricting.
            // State-based restricting is used when the state has an {restrict} parameter and the state's current
            // subject (name) matches the model's queryParameterSubject value (which, by default, is the model's
            // subject).
            // However, queryParameterSubject may be changed in order to customise which model gets to use the
            // state's query parameters.
            // Model-based restricting ignores state parameters and instead stores restrictions in the model
            // (internally)
            if( this.parentModel.hasQueryParameter( 'restrict' ) ) {
              // do state-based restricting
              var restrict = this.columnRestrictLists;
              if( 0 == newList.length ) {
                if( angular.isDefined( restrict[column] ) ) delete restrict[column];
              } else {
                restrict[column] = newList;
              }

              // now remove the descriptions from all restrictions
              for( var name in restrict ) {
                restrict[name].forEach( function( obj ) {
                  if( angular.isDefined( obj.description ) ) delete obj.description;
                } );
              }

              this.parentModel.setQueryParameter(
                'restrict',
                angular.equals( restrict, {} ) ? undefined : angular.toJson( restrict )
              );
              this.parentModel.setQueryParameter( 'page', 1 );
              this.parentModel.reloadState( true );
            } else {
              // do model-based restricting
              this.columnRestrictLists[column] = angular.copy( newList );
              this.onList( true ).then( function() { self.paginationModel.currentPage = 1; } );
            }
          }
        } );

        // called when the pagination widget is used
        cenozo.addExtendableFunction( object, 'onPagination', function() {
          if( angular.isUndefined( this.paginationModel.ignore ) ) {
            // set the page as a query parameter
            this.parentModel.setQueryParameter( 'page', this.paginationModel.currentPage );
            this.parentModel.reloadState( false );

            // get more records if the max index is past the last record or the min index is before the first one
            if( this.cache.length < this.total &&
                ( this.paginationModel.getMaxIndex() >= this.cache.length + this.minOffset ) ||
                ( this.paginationModel.getMinIndex() < this.minOffset ) ) this.onList();
          }
        } );

        /**
         * Add a function to be executed after onApplyChosen is complete
         * 
         * @param function
         */
        object.afterChoose = function( fn ) {
          // make sure the function doesn't already exist
          if( !this.afterChooseFunctions.some( function( viewFn ) {
            return fn === viewFn || fn.toString() == viewFn.toString();
          } ) ) this.afterChooseFunctions.push( fn );
        };
        object.afterChooseFunctions = [];

        /**
         * Adds a record on the server in a many-to-many relationship.
         * 
         * @param object record: The record to choose
         * @return promise
         */
        cenozo.addExtendableFunction( object, 'onApplyChosen', function() {
          var self = this;
          if( !this.parentModel.getChooseEnabled() )
            throw new Error( 'Calling onApplyChosen() but choose is not enabled.' );

          var data = {};
          var addArray = this.cache.reduce( function( list, record ) {
            if( 1 === record.chosenNow ) list.push( record.id );
            return list;
          }, [] );
          if( 0 < addArray.length ) data.add = addArray;
          var removeArray = this.cache.reduce( function( list, record ) {
            if( 0 === record.chosenNow ) list.push( record.id );
            return list;
          }, [] );
          if( 0 < removeArray.length ) data.remove = removeArray;

          var promise = 0 == addArray.length && 0 == removeArray.length
                      ? $q.all()
                      : CnHttpFactory.instance( {
                          path: this.parentModel.getServiceCollectionPath(),
                          data: data,
                          onError: function( response ) { self.onApplyChosenError( response ); }
                        } ).post();
          return promise.then( function() {
            self.toggleChooseMode();
            self.afterChooseFunctions.forEach( function( fn ) { fn(); } );
          } );
        } );

        /**
         * Handles erros when applying chosen records.
         * 
         * @param object response: The response of a failed http call
         */
        cenozo.addExtendableFunction( object, 'onApplyChosenError', function( response ) {
          CnModalMessageFactory.httpError( response );
        } );

        /**
         * Add a function to be executed after onDelete is complete
         * 
         * @param function
         */
        object.afterDelete = function( fn ) {
          // make sure the function doesn't already exist
          if( !this.afterDeleteFunctions.some( function( viewFn ) {
            return fn === viewFn || fn.toString() == viewFn.toString();
          } ) ) this.afterDeleteFunctions.push( fn );
        };
        object.afterDeleteFunctions = [];

        /**
         * Deletes a record from the server.
         * 
         * @param object record: The record to delete
         * @return promise
         */
        cenozo.addExtendableFunction( object, 'onDelete', function( record ) {
          var self = this;
          if( !this.parentModel.getDeleteEnabled() )
            throw new Error( 'Calling onDelete() but delete is not enabled.' );

          var httpObj = { path: this.parentModel.getServiceResourcePath( record.getIdentifier() ) };
          httpObj.onError = function( response ) { self.onDeleteError( response ); }
          return CnHttpFactory.instance( httpObj ).delete().then( function() {
            self.cache.some( function( item, index, array ) {
              if( item.getIdentifier() == record.getIdentifier() ) {
                self.total--;
                array.splice( index, 1 );
                return true; // stop processing
              }
            } );
            self.afterDeleteFunctions.forEach( function( fn ) { fn(); } );
          } );
        } );

        /**
         * Handles errors when deleting records.
         * 
         * @param object response: The response of a failed http call
         */
        cenozo.addExtendableFunction( object, 'onDeleteError', function( response ) {
          if( 409 == response.status ) {
            CnModalMessageFactory.instance( {
              title: 'Unable to delete ' + this.parentModel.module.name.singular + ' record',
              message: 'It is not possible to delete this ' + this.parentModel.module.name.singular +
                       ' record because it is being referenced by "' + response.data +
                       '" in the database.',
              error: true
            } ).show();
          } else { CnModalMessageFactory.httpError( response ); }
        } );

        /**
         * Add a function to be executed after onList is complete
         * 
         * @param function
         */
        object.afterList = function( fn ) {
          // make sure the function doesn't already exist
          if( !this.afterListFunctions.some( function( viewFn ) {
            return fn === viewFn || fn.toString() == viewFn.toString();
          } ) ) this.afterListFunctions.push( fn );
        };
        object.afterListFunctions = [];

        /**
         * Loads records from the server.
         * 
         * @param boolean replace: Whether to replace the cached list or append to it
         * @return promise
         */
        cenozo.addExtendableFunction( object, 'onList', function( replace ) {
          var self = this;

          // change the parent model's listing state
          this.parentModel.listingState = 'list';

          if( angular.isUndefined( replace ) ) replace = false;
          if( replace ) {
            this.cache = [];
            this.minOffset = null;
          }

          // determine if there is a row highlight condition
          var highlightCondition = {};
          for( var column in this.parentModel.columnList ) {
            var highlight = this.parentModel.columnList[column].highlight;
            if( angular.isDefined( highlight ) ) {
              highlightCondition[column] = highlight;
            }
          };

          // set up the restrict, offset and sorting
          if( this.parentModel.hasQueryParameter( 'restrict' ) ) {
            var restrict = this.parentModel.getQueryParameter( 'restrict' );
            if( angular.isDefined( restrict ) ) {
              this.columnRestrictLists = angular.fromJson( restrict );
              for( var name in this.columnRestrictLists ) {
                this.columnRestrictLists[name].forEach( function( obj ) {
                  obj.description = CnSession.describeRestriction(
                    angular.isDefined( self.parentModel.module.columnList[name] ) ?
                      self.parentModel.module.columnList[name].type : 'string',
                    obj.test,
                    obj.value,
                    obj.unit
                  );
                } );
              }
            }
          }
          if( this.parentModel.hasQueryParameter( 'order' ) ) {
            var order = this.parentModel.getQueryParameter( 'order' );
            if( angular.isDefined( order ) ) this.order.column = order;
            var reverse = this.parentModel.getQueryParameter( 'reverse' );
            if( angular.isDefined( reverse ) ) this.order.reverse = reverse;
          }

          // Calling query() below will reset the pagination model's currentPage to 1, so we'll store
          // the page value (from query parameters) if it exists, or the pagination model's currentPage
          // if not, and we'll also mark the paginationModel to ignore (so that the state's page param
          // isn't set to 1)
          var currentPage = replace ? 1 : this.paginationModel.currentPage;
          var queryCurrentPage = self.parentModel.getQueryParameter( 'page' );
          if( angular.isDefined( queryCurrentPage ) ) currentPage = queryCurrentPage;
          self.paginationModel.ignore = true;

          // start by getting the data from the parent model using the column restrict lists
          var data = this.parentModel.getServiceData( 'list', this.columnRestrictLists );
          if( angular.isUndefined( data.modifier ) ) data.modifier = {};
          data.assert_offset = (currentPage-1) * this.paginationModel.itemsPerPage + 1;
          if( this.parentModel.getChooseEnabled() && this.chooseMode ) data.choosing = 1;

          // add the table prefix to the column if there isn't already a prefix
          var column = this.order.column;
          data.modifier.order = {};
          data.modifier.order[column] = this.order.reverse;

          this.total = 0;
          this.isLoading = true;

          var httpObj = { path: this.parentModel.getServiceCollectionPath(), data: data };
          httpObj.onError = function( response ) { self.onListError( response ); }

          return CnHttpFactory.instance( httpObj ).query().then( function( response ) {
            // Now that the query is done we can restore the pagination model's currentPage and remove
            // the "ignore" parameter
            delete self.paginationModel.ignore;
            
            self.paginationModel.currentPage = currentPage;
            var offset = parseInt( response.headers( 'Offset' ) );
            if( null == self.minOffset || offset < self.minOffset ) self.minOffset = offset;

            // add the getIdentifier() method to each row before adding it to the cache
            response.data.forEach( function( item ) {
              item.getIdentifier = function() { return self.parentModel.getIdentifierFromRecord( this ); };

              // check if we should highlight the row (by default no)
              item.$highlight = false;
              for( var name in highlightCondition ) {
                item.$highlight = item[name] == highlightCondition[name];
                if( !item.$highlight ) break; // don't highlight if any condition doesn't match
              }
            } );
            self.cache = self.cache.concat( response.data );
            self.total = parseInt( response.headers( 'Total' ) );
            self.isReportAllowed = CnSession.application.maxBigReport >= self.total;
            self.isReportBig = CnSession.application.maxSmallReport < self.total;
            self.afterListFunctions.forEach( function( fn ) { fn(); } );
          } ).finally( function() { self.isLoading = false; } );
        } );

        /**
         * Handles errors when listing records.
         * 
         * @param object response: The response of a failed http call
         */
        cenozo.addExtendableFunction( object, 'onListError', function( response ) {
          CnModalMessageFactory.httpError( response );
        } );

        /**
         * Loads a report from the server.
         * 
         * @return promise
         */
        cenozo.addExtendableFunction( object, 'onReport', function( format ) {
          var self = this;
          this.isReportLoading = true;
          if( angular.isUndefined( format ) ) format = 'csv';

          // set up the sorting
          if( this.parentModel.hasQueryParameter( 'order' ) ) {
            var order = this.parentModel.getQueryParameter( 'order' );
            if( angular.isDefined( order ) ) this.order.column = order;
            var reverse = this.parentModel.getQueryParameter( 'reverse' );
            if( angular.isDefined( reverse ) ) this.order.reverse = reverse;
          }

          // start by getting the data from the parent model using the column restrict lists
          var data = this.parentModel.getServiceData( 'report', this.columnRestrictLists );
          if( angular.isUndefined( data.modifier ) ) data.modifier = {};

          // add the table prefix to the column if there isn't already a prefix
          var column = this.order.column;
          data.modifier.order = {};
          data.modifier.order[column] = this.order.reverse;

          var httpObj = { path: this.parentModel.getServiceCollectionPath(), data: data };
          httpObj.onError = function( response ) { self.onReportError( response ); }
          httpObj.format = format;
          return CnHttpFactory.instance( httpObj ).query().then( function( response ) {
            self.reportBlob = new Blob(
              [response.data],
              { type: response.headers( 'Content-Type' ).replace( /"(.*)"/, '$1' ) }
            );
            self.reportFilename = response.headers( 'Content-Disposition' ).match( /filename=(.*);/ )[1];
          } ).finally( function() { self.isReportLoading = false; } );
        } );

        /**
         * Handles errors when getting a report.
         * 
         * @param object response: The response of a failed http call
         */
        cenozo.addExtendableFunction( object, 'onReportError', function( response ) {
          CnModalMessageFactory.httpError( response );
        } );

        /**
         * Add a function to be executed after onSelect is complete
         * 
         * @param function
         */
        object.afterSelect = function( fn ) {
          // make sure the function doesn't already exist
          if( !this.afterSelectFunctions.some( function( viewFn ) {
            return fn === viewFn || fn.toString() == viewFn.toString();
          } ) ) this.afterSelectFunctions.push( fn );
        };
        object.afterSelectFunctions = [];

        /**
         * Adds a record on the server in a many-to-many relationship.
         * 
         * @param object record: The record to select
         * @return promise
         */
        cenozo.addExtendableFunction( object, 'onSelect', function( record ) {
          if( !this.parentModel.getViewEnabled() )
            throw new Error( 'Calling onSelect() but view is not enabled.' );
          this.afterSelectFunctions.forEach( function( fn ) { fn(); } );
          return this.parentModel.transitionToViewState( record );
        } );

        cenozo.addExtendableFunction( object, 'toggleChooseMode', function() {
          this.chooseMode = !this.chooseMode;
          return this.onList( true );
        } );

        /**
         * The state transition to execute after clicking the add button
         */
        cenozo.addExtendableFunction( object, 'transitionOnAdd', function() {
          this.parentModel.transitionToAddState();
        } );
      }
    };
  }
] );

/* ######################################################################################################## */

/**
 * The base factory for all module View factories
 */
cenozo.factory( 'CnBaseViewFactory', [
  'CnSession', 'CnHttpFactory', 'CnModalMessageFactory', '$injector', '$filter', '$q',
  function( CnSession, CnHttpFactory, CnModalMessageFactory, $injector, $filter, $q ) {
    // mechanism to cache factories
    var factoryCacheList = {};
    function getFactory( name ) {
      if( angular.isUndefined( factoryCacheList[name] ) ) {
        if( !$injector.has( name ) ) throw new Error( 'Unable to get ' + name + ' dependency.' );
        factoryCacheList[name] = $injector.get( name );
      }
      return factoryCacheList[name];
    };

    return {
      construct: function( object, parentModel, addDependencies ) {
        if( angular.isUndefined( addDependencies ) ) addDependencies = false;
        object.parentModel = parentModel;
        object.heading = parentModel.module.name.singular.ucWords() + ' Details';
        object.record = {};
        object.formattedRecord = {};
        object.backupRecord = {};
        object.isReportLoading = false;
        object.reportBlob = null;
        object.reportFilename = null;
        object.isLoading = false;
        object.deferred = $q.defer();

        // for all dependencies require its files, inject and set up the model
        var promiseList = parentModel.module.children.concat( parentModel.module.choosing ).reduce(
          function( array, item ) {
            if( null == item.deferred ) {
              item.deferred = $q.defer();
              require( item.getRequiredFiles(), function() { item.deferred.resolve(); } );
            }
            return array.concat( item.deferred.promise );
          }, []
        );

        $q.all( promiseList ).then( function() { object.deferred.resolve(); } );

        // when ready set up dependent models
        if( addDependencies ) {
          object.deferred.promise.then( function() {
            parentModel.module.children.forEach( function( item ) {
              var factoryName = 'Cn' + item.subject.Camel + 'ModelFactory';
              var model = getFactory( factoryName ).instance();
              // rewrite get*Enabled functions
              model.$$getAddEnabled = function() {
                return angular.isDefined( model.module.actions.add ) && parentModel.getEditEnabled();
              }
              model.$$getDeleteEnabled = function() {
                return angular.isDefined( model.module.actions.delete ) && parentModel.getEditEnabled();
              }
              model.$$getViewEnabled = function() {
                return angular.isDefined( model.module.actions.view ) && parentModel.getViewEnabled();
              }
              object[item.subject.camel+'Model'] = model;
            } );
            parentModel.module.choosing.forEach( function( item ) {
              var factoryName = 'Cn' + item.subject.Camel + 'ModelFactory';
              var model = getFactory( factoryName ).instance();
              // rewrite get*Enabled functions
              model.$$getChooseEnabled = function() { return true; };
              model.$$getAddEnabled = function() { return false; };
              model.$$getDeleteEnabled = function() { return false; };
              model.$$getEditEnabled = function() { return false; };
              object[item.subject.camel+'Model'] = model;
            } );
          } );
        }

        /**
         * Updates a property of the formatted copy of the record
         */
        cenozo.addExtendableFunction( object, 'updateFormattedRecord', function( property, type ) {
          if( angular.isDefined( property ) ) {
            if( angular.isUndefined( type ) ) {
              var input = this.parentModel.module.getInput( property );
              if( null !== input ) type = input.type;
            }

            if( angular.isDefined( type ) ) {
              if( 'lookup-typeahead' == type ) {
                // When lookup-typeaheads are first loaded move the formatted property from the record
                // to the formatted record.  We must do this so that future calls to this function do
                // not overrite the formatted typeahead property (the onSelectTypeahead callback is
                // responsible for that)
                if( angular.isDefined( this.record['formatted_'+property] ) ) {
                  this.formattedRecord[property] = this.record['formatted_'+property];
                  delete this.record['formatted_'+property];
                }
              } else if( 'size' == type ) {
                this.formattedRecord[property] = $filter( 'cnSize' )( this.record[property] ).split( ' ' );
              } else {
                this.formattedRecord[property] =
                  CnSession.formatValue( this.record[property], type, true );
              }
            }
          } else {
            // update all properties
            for( var property in this.record ) this.updateFormattedRecord( property );
          }
        } );

        /**
         * Add a function to be executed after onDelete is complete
         * 
         * @param function
         */
        object.afterDelete = function( fn ) {
          // make sure the function doesn't already exist
          if( !this.afterDeleteFunctions.some( function( viewFn ) {
            return fn === viewFn || fn.toString() == viewFn.toString();
          } ) ) this.afterDeleteFunctions.push( fn );
        };
        object.afterDeleteFunctions = [];

        /**
         * Deletes the viewed record from the server.
         * 
         * @return promise
         */
        cenozo.addExtendableFunction( object, 'onDelete', function() {
          var self = this;
          if( !this.parentModel.getDeleteEnabled() )
            throw new Error( 'Calling onDelete() but delete is not enabled.' );

          var httpObj = { path: this.parentModel.getServiceResourcePath() };
          httpObj.onError = function( response ) { self.onDeleteError( response ); }
          return CnHttpFactory.instance( httpObj ).delete().then( function() {
            self.afterDeleteFunctions.forEach( function( fn ) { fn(); } );
          } );
        } );

        /**
         * Handles erros when deleting records.
         * 
         * @param object response: The response of a failed http call
         */
        cenozo.addExtendableFunction( object, 'onDeleteError', function( response ) {
          if( 409 == response.status ) {
            CnModalMessageFactory.instance( {
              title: 'Unable to delete ' + this.parentModel.module.name.singular + ' record',
              message: 'It is not possible to delete this ' + this.parentModel.module.name.singular +
                       ' record because it is being referenced by "' + response.data +
                       '" in the database.',
              error: true
            } ).show();
          } else { CnModalMessageFactory.httpError( response ); }
        } );

        /**
         * Add a function to be executed after onPatch is complete
         * 
         * @param function
         */
        object.afterPatch = function( fn ) {
          // make sure the function doesn't already exist
          if( !this.afterPatchFunctions.some( function( viewFn ) {
            return fn === viewFn || fn.toString() == viewFn.toString();
          } ) ) this.afterPatchFunctions.push( fn );
        };
        object.afterPatchFunctions = [];

        /**
         * Makes changes to a record on the server.
         * 
         * @param object data: An object of column -> value pairs to change
         * @return promise
         */
        cenozo.addExtendableFunction( object, 'onPatch', function( data ) {
          var self = this;
          if( !this.parentModel.getEditEnabled() ) throw new Error( 'Calling onPatch() but edit is not enabled.' );

          var httpObj = {
            path: this.parentModel.getServiceResourcePath(),
            data: data
          };
          httpObj.onError = function( response ) { self.onPatchError( response ); }
          return CnHttpFactory.instance( httpObj ).patch().then( function() {
            self.afterPatchFunctions.forEach( function( fn ) { fn(); } );
          } );
        } );

        /**
         * Handles erros when patching records.
         * 
         * @param object response: The response of a failed http call
         */
        cenozo.addExtendableFunction( object, 'onPatchError', function( response ) {
          if( 409 == response.status ) {
            // report which inputs are included in the conflict
            response.data.forEach( function( item ) {
              var element = cenozo.getFormElement( item );
              if( element ) {
                element.$error.conflict = true;
                cenozo.updateFormElement( element, true );
              }
            } );
          } else {
            // make sure to put the data back
            var property = Object.keys( response.config.data )[0];
            this.record[property] = this.backupRecord[property];
            CnModalMessageFactory.httpError( response );
          }
        } );

        /**
         * Loads a report from the server.
         * 
         * @return promise
         */
        cenozo.addExtendableFunction( object, 'onReport', function( format ) {
          var self = this;
          this.isReportLoading = true;

          if( angular.isUndefined( format ) ) format = 'csv';
          // the "report" service data type is for lists only, use view instead
          var data = this.parentModel.getServiceData( 'view', this.columnRestrictLists );
          if( angular.isUndefined( data.modifier ) ) data.modifier = {};

          var httpObj = { path: this.parentModel.getServiceResourcePath(), data: data };
          httpObj.onError = function( response ) { self.onReportError( response ); }
          httpObj.format = format;
          return CnHttpFactory.instance( httpObj ).get().then( function( response ) {
            self.reportBlob = new Blob(
              [response.data],
              { type: response.headers( 'Content-Type' ).replace( /"(.*)"/, '$1' ) }
            );
            self.reportFilename = response.headers( 'Content-Disposition' ).match( /filename=(.*);/ )[1];
          } ).finally( function() { self.isReportLoading = false; } );
        } );

        /**
         * Handles errors when getting a report.
         * 
         * @param object response: The response of a failed http call
         */
        cenozo.addExtendableFunction( object, 'onReportError', function( response ) {
          CnModalMessageFactory.httpError( response );
        } );

        /**
         * Add a function to be executed after onView is complete
         * 
         * @param function
         */
        object.afterView = function( fn ) {
          // make sure the function doesn't already exist
          if( !this.afterViewFunctions.some( function( viewFn ) {
            return fn === viewFn || fn.toString() == viewFn.toString();
          } ) ) this.afterViewFunctions.push( fn );
        };
        object.afterViewFunctions = [];

        /**
         * Loads data from the server to view the record.
         * 
         * Note: this function will override the usual error mechanism to change the state to one of
         * the error states.  This is because not having a view record is considered to be too severe an
         * error to show the usual user interface.
         * @return promise
         */
        cenozo.addExtendableFunction( object, 'onView', function() {
          this.isLoading = true;
          var self = this;
          if( !this.parentModel.getViewEnabled() ) throw new Error( 'Calling onView() but view is not enabled.' );

          // get the record's data and metadata
          return CnHttpFactory.instance( {
            path: this.parentModel.getServiceResourcePath(),
            data: this.parentModel.getServiceData( 'view' ),
            redirectOnError: true,
            noActivity: false
          } ).get().then( function( response ) {
            if( '' === response.data )
              throw new Error( 'Request for record responded with an empty string (should be 403 or 404).' );

            // create the record
            self.record = angular.copy( response.data );
            self.record.getIdentifier = function() { return self.parentModel.getIdentifierFromRecord( this ); };

            // create the backup record
            self.backupRecord = angular.copy( self.record );

            // reset the error status
            cenozo.forEachFormElement( 'form', function( element ) {
              element.$error = {};
              cenozo.updateFormElement( element, true );
            } );

            return self.parentModel.metadata.getPromise();
          } ).then( function() {
            var promiseList = [];

            if( angular.isDefined( self.parentModel.metadata.columnList.rank ) ) { // create enum for rank columns
              // add the parent subject and identifier to the service
              var path = self.parentModel.getServiceCollectionPath();
              var parent = self.parentModel.getParentIdentifier();
              if( angular.isDefined( parent.subject ) && angular.isDefined( parent.identifier ) )
                path = [ parent.subject, parent.identifier, path ].join( '/' );

              promiseList.push( CnHttpFactory.instance( {
                path: path,
                data: { select: { column: {
                  column: 'MAX(' + self.parentModel.module.subject.snake + '.rank)',
                  alias: 'max',
                  table_prefix: false
                } } },
                redirectOnError: true
              } ).query().then( function( response ) {
                if( 0 < response.data.length ) {
                  self.parentModel.metadata.columnList.rank.enumList = [];
                  if( null !== response.data[0].max ) {
                    for( var rank = 1; rank <= parseInt( response.data[0].max ); rank++ ) {
                      self.parentModel.metadata.columnList.rank.enumList.push( {
                        value: rank,
                        name: $filter( 'cnOrdinal' )( rank )
                      } );
                    }
                  }
                }
              } ) );
            }

            // convert blank enums into empty strings (for ng-options)
            self.parentModel.module.inputGroupList.forEach( function( group ) {
              for( var column in group.inputList ) {
                var input = group.inputList[column];
                if( 'view' != input.exclude &&
                    0 <= ['boolean','enum','rank'].indexOf( input.type ) &&
                    null === self.record[column] ) {
                  var metadata = self.parentModel.metadata.columnList[column];
                  if( angular.isDefined( metadata ) && !metadata.required ) {
                    self.record[column] = '';
                    self.backupRecord[column] = '';
                  }
                }
              }
            } );

            // update all properties in the formatted record
            self.updateFormattedRecord();

            return $q.all( promiseList ).then( function() {
              self.afterViewFunctions.forEach( function( fn ) { fn(); } );
            } ).finally( function() { self.isLoading = false; } );
          } );
        } );

        /**
         * The state transition to execute after clicking the view parent button (may have multiple)
         * 
         * @param string subject: The subject of the parent to transition to
         */
        cenozo.addExtendableFunction( object, 'transitionOnViewParent', function( subject ) {
          if( !subject ) {
            this.parentModel.transitionToParentListState( this.parentModel.module.subject.snake );
          } else {
            var parent = this.parentModel.module.identifier.parent.findByProperty( 'subject', subject );
            if( null === parent ) {
              throw new Error( 'Tried to transition to parent ' + subject + ' from view state but "' +
                this.parentModel.module.subject.camel + '" record has no "' + subject + '" parent.' );
            }
            this.parentModel.transitionToParentViewState( parent.subject, parent.getIdentifier( this.record ) );
          }
        } );

        /**
         * The state transition to execute after clicking the delete button
         */
        cenozo.addExtendableFunction( object, 'transitionOnDelete', function() {
          var self = this;
          CnSession.workingTransition( function() {
            if( angular.isDefined( self.parentModel.module.identifier.parent ) ) {
              var parent = self.parentModel.getParentIdentifier();
              self.parentModel.transitionToParentViewState( parent.subject, parent.identifier );
            } else {
              self.parentModel.transitionToListState();
            }
          } );
        } );
      }
    };
  }
] );

/* ######################################################################################################## */

/**
 * The base factory for all module Model factories
 */
cenozo.factory( 'CnBaseModelFactory', [
  '$state', '$filter', 'CnSession', 'CnHttpFactory',
  function( $state, $filter, CnSession, CnHttpFactory ) {
    return {
      construct: function( object, module ) {
        // Note: methods are added to Object here, members below
        var self = object;

        /**
         * get the identifier based on what is in the model's module
         */
        cenozo.addExtendableFunction( self, 'getIdentifierFromRecord', function( record, valueOnly ) {
          var valueOnly = angular.isUndefined( valueOnly ) ? false : valueOnly;
          var column = angular.isDefined( self.module.identifier.column ) ? self.module.identifier.column : 'id';
          return valueOnly || 'id' == column ? String( record[column] ) : column + '=' + record[column];
        } );

        /**
         * Get a user-friendly name for the record (may not be unique)
         * 
         * This method is sometimes extended by a module's event factory
         */
        cenozo.addExtendableFunction( self, 'getBreadcrumbTitle', function() {
          var type = self.getActionFromState();
          var index = type.indexOf( '_' );
          if( 0 <= index ) type = type.substring( 0, index );

          // first try for a friendly name
          var friendlyColumn = self.module.name.friendlyColumn;
          if( angular.isDefined( friendlyColumn ) && angular.isDefined( self.viewModel.record[friendlyColumn] ) )
            return self.viewModel.record[friendlyColumn] ? self.viewModel.record[friendlyColumn] : type;

          // no friendly name, try for an identifier column
          return angular.isDefined( self.module.identifier.column )
               ? self.getIdentifierFromRecord( self.viewModel.record, true )
               : type; // database IDs aren't friendly so just return the type (view, calendar, etc)
        } );

        /**
         * Get a user-friendly name for the record's parent (may not be unique)
         * 
         * This method is sometimes extended by a module's event factory
         */
        cenozo.addExtendableFunction( self, 'getBreadcrumbParentTitle', function() {
          var parent = self.getParentIdentifier();
          return angular.isDefined( parent.friendly )
               ? self.viewModel.record[parent.friendly]
               : String( parent.identifier ).split( '=' ).pop();
        } );

        /**
         * get the state's subject
         */
        cenozo.addExtendableFunction( self, 'getSubjectFromState', function() {
          var stateNameParts = $state.current.name.split( '.' );
          if( 2 != stateNameParts.length )
            throw new Error( 'State "' + $state.current.name + '" is expected to have exactly 2 parts.' );
          return stateNameParts[0];
        } );

        /**
         * get the state's action
         */
        cenozo.addExtendableFunction( self, 'getActionFromState', function() {
          var stateNameParts = $state.current.name.split( '.' );
          if( 2 != stateNameParts.length )
            throw new Error( 'State "' + $state.current.name + '" is expected to have exactly 2 parts.' );
          return stateNameParts[1];
        } );

        /**
         * determine whether a query parameter belongs to the model
         */
        cenozo.addExtendableFunction( self, 'hasQueryParameter', function( name ) {
          return angular.isDefined( $state.current.url ) &&
                 0 <= $state.current.url.indexOf( '{' + name + '}' ) &&
                 self.getSubjectFromState() == self.queryParameterSubject;
        } );

        /**
         * return a query parameter (will be undefined if it doesn't belong to the model)
         */
        cenozo.addExtendableFunction( self, 'getQueryParameter', function( name ) {
          var parameter = undefined;
          if( self.hasQueryParameter( name ) ) {
            var parameter = $state.params[name];
            // convert string booleans to true booleans
            if( 'false' === parameter ) parameter = false;
            else if( 'true' === parameter ) parameter = true;
          }
          return parameter;
        } );

        /**
         * sets a query parameter (does nothing if it doesn't belong to the model)
         */
        cenozo.addExtendableFunction( self, 'setQueryParameter', function( name, value ) {
          if( self.hasQueryParameter( name ) ) {
            if( angular.isUndefined( value ) ) {
              if( angular.isDefined( $state.params[name] ) ) delete $state.params[name];
            } else {
              $state.params[name] = value;
            }
          }
        } );

        /**
         * get the parent identifier (either from the state or the module)
         * NOTE: when viewing the function will return the first parent that is set in the view record
         *       (there may be multiple)
         */
        cenozo.addExtendableFunction( self, 'getParentIdentifier', function() {
          var response = {
            subject: self.getSubjectFromState(),
            identifier: $state.params.parentIdentifier
          };

          if( angular.isUndefined( response.identifier ) ) {
            var action = self.getActionFromState();
            if( 'view' == action && angular.isDefined( self.module.identifier.parent ) &&
                angular.isDefined( self.viewModel ) ) {
              // return the FIRST "set" parent
              self.module.identifier.parent.some( function( item ) {
                if( self.viewModel.record[item.alias] ) {
                  response.subject = item.subject;
                  if( angular.isDefined( item.friendly ) ) response.friendly = item.friendly;
                  response.identifier = item.getIdentifier( self.viewModel.record );
                  return true; // stop processing
                }
              } );
            } // no need to test the add states as they always have a parentIdentifier in the state params
          }

          // the subject is incorrect if we haven't got a parent identifier
          if( angular.isUndefined( response.identifier ) ) response.subject = undefined;

          return response;
        } );

        /**
         * Returns the collection path for this model
         * 
         * @param boolean ignoreParent Whether to not include parent's part of the path
         */
        cenozo.addExtendableFunction( self, 'getServiceCollectionPath', function( ignoreParent ) {
          if( angular.isUndefined( ignoreParent ) ) ignoreParent = false;
          var path = '';
          if( !ignoreParent && self.getSubjectFromState() != self.module.subject.snake ) {
            var identifier = $state.params.parentIdentifier
                           ? $state.params.parentIdentifier
                           : $state.params.identifier;
            path += self.getSubjectFromState() + '/' + identifier + '/';
          }
          return path + self.module.subject.snake;
        } );

        /**
         * Returns the resource path for this model
         * 
         * @param string|integer The resource may be specified, or if left blank the state's parameters
         *                       will be used instead
         */
        cenozo.addExtendableFunction( self, 'getServiceResourcePath', function( resource ) {
          var identifier = angular.isUndefined( resource ) ? $state.params.identifier : resource;
          return self.getServiceCollectionPath() + '/' + identifier;
        } );

        /**
         * Returns the service data used by onList, OnView, etc, functions
         * 
         * @param string type One of calendar, list, report or view
         * @param array columnRestrictLists Column restrictions
         */
        cenozo.addExtendableFunction( self, 'getServiceData', function( type, columnRestrictLists ) {
          if( angular.isUndefined( type ) || 0 > ['calendar','list','report','view'].indexOf( type ) )
            throw new Error(
              'getServiceData expects an argument which is either "calendar", "list", "report" or "view".'
            );

          if( angular.isUndefined( columnRestrictLists ) ) columnRestrictLists = {};

          // set up the select, join and where list based on the column list
          var selectList = [];
          var joinList = [];
          var whereList = [];

          var list = {};
          if( 'calendar' == type ) {
            // the calendar doesn't need anything added to list
          } else if( 'list' == type || 'report' == type ) {
            list = self.columnList;
          } else {
            // we need to get a list of all inputs from the module's input groups
            self.module.inputGroupList.forEach( function( group ) {
              for( var column in group.inputList ) {
                var input = group.inputList[column];
                if( 'view' != input.exclude ) list[column] = input;
              }
            } );
          }

          // add identifier data if it is missing
          if( angular.isDefined( self.module.identifier.column ) &&
              angular.isUndefined( list[self.module.identifier.column] ) )
            list[self.module.identifier.column] = { type: 'hidden' };

          if( 'view' == type && angular.isDefined( self.module.identifier.parent ) ) {
            self.module.identifier.parent.forEach( function( item ) {
              list[item.alias] = { type: 'hidden', column: item.column };
            } );
          }

          for( var key in list ) {
            // skip excluded columns
            if( 'separator' == list[key].type ) continue;

            var parentTable = self.module.subject.snake;

            // determine the table and column names
            var tableName = null;
            var columnName = null;
            if( angular.isUndefined( list[key].column ) ) {
              columnName = key;
            } else { // a column was specified in the item's details module
              var columnParts = list[key].column.split( '.' );
              if( 2 == columnParts.length ) {
                tableName = columnParts[0];
                columnName = columnParts[1];
              } else if( 1 == columnParts.length ) {
                columnName = columnParts[0];
              } else {
                console.error(
                  'Column name "%s" can have a maximum of two parts: "table.column".', list[key].column );
                continue; // skip to the next item in the list
              }
            }

            // if a table is specified then build a join to that table
            if( null != tableName ) {
              // don't join a table to itself
              if( tableName !== parentTable ) {
                var onleft = parentTable + '.' + tableName + '_id';
                var onright = tableName + '.id';

                // see if the join to table already exists
                var join = null;
                joinList.some( function( item ) {
                  if( item.table == tableName && item.onleft == onleft && item.onright == onright ) {
                    join = item;
                    return true; // stop processing
                  }
                } );

                // if the join wasn't found then add it to the list
                if( null === join ) {
                  join = { table: tableName, onleft: onleft, onright: onright };
                  joinList.push( join );
                }
              }
            }

            // now add the column details to the selectList
            if( 'months' == list[key].type ) {
              for( var month = 0; month < 12; month++ )
                selectList.push( angular.lowercase( moment().month( month ).format( 'MMMM' ) ) );
            } else if( 'days' == list[key].type ) {
              for( var day = 0; day < 7; day++ )
                selectList.push( angular.lowercase( moment().day( day ).format( 'dddd' ) ) );
            } else {
              // add column to the select list
              var select = { column: columnName, alias: key };
              if( null != tableName ) select.table = tableName;
              selectList.push( select );
            }

            if( ( 'list' == type || 'report' == type ) &&
                'hidden' != list[key].type && angular.isArray( columnRestrictLists[key] ) ) {
              // add brackets around columns with multiple restrictions
              if( 1 < columnRestrictLists[key].length ) whereList.push( { bracket: true, open: true } );

              columnRestrictLists[key].forEach( function( item ) {
                var test = item.test;
                var value = item.value;
                var unit = item.unit;

                // simple search
                if( ( 'like' == test || 'not like' == test ) ) {
                  // LIKE "" is meaningless, so search for <=> "" instead
                  if( 0 == value.length ) test = '<=>';
                  // LIKE without % is meaningless, so add % at each end of the string
                  else if( 0 > value.indexOf( '%' ) ) value = '%' + value + '%';
                }

                // convert units
                if( angular.isDefined( unit ) ) value = $filter( 'cnSize' )( value + ' ' + unit, true );

                // determine the column name
                var column = key;
                if( angular.isDefined( list[key].column ) ) {
                  var columnParts = list[key].column.split( '.' );
                  var len = columnParts.length;
                  column = list[key].column;
                  if( 2 < len ) column = columnParts[len-2] + '.' + columnParts[len-1];
                }

                var where = { column: column, operator: test, value: value };
                if( 'or' == item.logic ) where.or = true;
                whereList.push( where );
              } );

              // add brackets around columns with multiple restrictions
              if( 1 < columnRestrictLists[key].length ) whereList.push( { bracket: true, open: false } );
            }
          }

          var data = {};
          if( 'calendar' == type || 'report' == type ) data.modifier = { limit: 1000000 }; // get all records
          if( 0 < selectList.length ) data.select = { column: selectList };
          if( 0 < joinList.length || 0 < whereList.length ) {
            if( angular.isUndefined( data.modifier ) ) data.modifier = {};
            if( 0 < joinList.length ) data.modifier.join = joinList;
            if( 0 < whereList.length ) data.modifier.where = whereList;
          }
          return data;
        } );

        /**
         * Reloads the current state
         * 
         * @param boolean reload Whether to force reload the state
         * @param boolean notify Whether to send notification of a state change
         */
        cenozo.addExtendableFunction( self, 'reloadState', function( reload, notify ) {
          if( angular.isUndefined( reload ) ) reload = false;
          if( angular.isUndefined( notify ) ) notify = true;
          return $state.transitionTo( $state.current, $state.params, { reload: reload, notify: notify } );
        } );

        /**
         * Transitions back to the previous state
         */
        cenozo.addExtendableFunction( self, 'transitionToLastState', function() {
          var stateName = $state.last.name;
          var params = $state.lastParams;
          if( 0 == stateName.length ) {
            var parent = self.getParentIdentifier();
            stateName = angular.isDefined( parent.subject )
                      ? parent.subject + '.view'
                      : '^.' + self.listingState;
            params = angular.isDefined( parent.subject ) ? { identifier: parent.identifier } : undefined;
          }

          return $state.go( stateName, params );
        } );

        /**
         * Transitions to this module's add state
         */
        cenozo.addExtendableFunction( self, 'transitionToAddState', function() {
          var stateName = $state.current.name;
          return 'view' == stateName.substring( stateName.lastIndexOf( '.' ) + 1 ) ?
            $state.go( '^.add_' + self.module.subject.snake, { parentIdentifier: $state.params.identifier } ) :
            $state.go( '^.add' );
        } );

        /**
         * Transitions to the module's list state
         */
        cenozo.addExtendableFunction( self, 'transitionToListState', function() {
          return $state.go( self.module.subject.snake + '.list' );
        } );

        /**
         * Transitions to the module's view state
         */
        cenozo.addExtendableFunction( self, 'transitionToViewState', function( record ) {
          var stateName = $state.current.name;
          var stateParams = { identifier: record.getIdentifier() };
          if( 'view' == stateName.substring( stateName.lastIndexOf( '.' ) + 1 ) )
            stateParams.parentIdentifier = $state.params.identifier;
          return $state.go( self.module.subject.snake + '.view', stateParams );
        } );

        /**
         * Transitions to the module's parent's view state
         */
        cenozo.addExtendableFunction( self, 'transitionToParentViewState', function( subject, identifier ) {
          return $state.go( subject + '.view', { identifier: identifier } );
        } );

        /**
         * Transitions to the module's parent's list state
         */
        cenozo.addExtendableFunction( self, 'transitionToParentListState', function( subject ) {
          if( angular.isUndefined( subject ) ) subject = '^';
          return $state.go( subject + '.list' );
        } );

        /**
         * Creates the breadcrumb trail using module and a specific type (add, list or view)
         */
        cenozo.addExtendableFunction( self, 'setupBreadcrumbTrail', function() {
          var stateSubject = self.getSubjectFromState();
          var parent = self.getParentIdentifier();

          // only set breadcrumbs when the module's or parent's subject matches the state's subject
          if( stateSubject != self.module.subject.snake && stateSubject != parent.subject ) return;

          var type = self.getActionFromState();
          var index = type.indexOf( '_' );
          if( 0 <= index ) type = type.substring( 0, index );

          var trail = [];

          // check the module for parents
          if( angular.isDefined( parent.subject ) ) {
            trail = trail.concat( [ {
              title: parent.subject.replace( /_/g, ' ' ).ucWords(),
              go: function() { return self.transitionToParentListState( parent.subject ); }
            }, {
              title: self.getBreadcrumbParentTitle(),
              go: function() { return $state.go( parent.subject + '.view', { identifier: parent.identifier } ); }
            } ] );
          }

          if( 'add' == type ) {
            trail = trail.concat( [ {
              title: self.module.name.singular.ucWords(),
              go: angular.isDefined( parent.subject ) ? undefined : function() { self.transitionToListState(); }
            }, {
              title: 'New'
            } ] );
          } else if( 'calendar' == type ) {
            trail = trail.concat( [ {
              title: self.module.name.singular.ucWords(),
              go: angular.isDefined( self.module.actions.list )
                ? function() { return self.transitionToParentListState( self.module.subject.snake ); }
                : undefined
            }, {
              title: self.getBreadcrumbTitle()
            } ] );
          } else if( 'list' == type ) {
            trail = trail.concat( [ {
              title: self.module.name.plural.ucWords()
            } ] );
          } else if( 'view' == type ) {
            trail = trail.concat( [ {
              title: self.module.name.plural.ucWords(),
              go: angular.isDefined( parent.subject ) ? undefined : function() { self.transitionToListState(); }
            }, {
              title: self.getBreadcrumbTitle()
            } ] );
          } else console.warn( 'Tried to setup breadcrumb trail for invalid type "%s".', type );

          // truncate the full trail if it is too long
          trail.forEach( function( crumb ) {
            if( 30 < crumb.title.length ) crumb.title = crumb.title.substring( 0, 28 ) + '...';
          } );

          CnSession.setBreadcrumbTrail( trail );
        } );

        /**
         * Makes an array containing items to be used by record add/view/list directives
         * 
         * When asking for the "list" type an array is created from the module's columnList property.
         * When asking for the "add" or "view" types an array is created from the module's inputList property.
         * The "view" type array is special as, unlike the other arrays which contain the items directly, the
         * "view" array contains an array of groups, each of which contains the items belonging to them.
         * NOTE: The returned arrays are COPIES of the module's items, not references.
         */
        cenozo.addExtendableFunction( self, 'getDataArray', function( removeList, type ) {
          if( angular.isUndefined( removeList ) ) removeList = [];

          // make a copy of the input list and remove any parent column(s)
          var stateSubject = self.getSubjectFromState();

          // create an array out of the input list
          var data = [];
          if( 'list' == type ) {
            for( var key in self.columnList ) {
              if( 0 > removeList.indexOf( key ) &&
                  // don't include hidden columns
                  'hidden' != self.columnList[key].type &&
                  // for child lists, don't include parent columns
                  !( stateSubject != self.module.subject.snake &&
                     angular.isDefined( self.columnList[key].column ) &&
                     stateSubject == self.columnList[key].column.split( '.' )[0] ) ) {
                data.push( self.columnList[key] );
              }
            }
          } else { // add or view
            data = self.module.inputGroupList.reduce( function( data, group ) {
              var inputArray = Object.keys( group.inputList ).map( function( key ) {
                return group.inputList[key];
              } ).filter( function( input ) {
                return 0 > removeList.indexOf( input.key ) &&
                       stateSubject+'_id' != input.key &&
                       type != input.exclude;
              } );

              if( 0 < inputArray.length ) data.push( {
                title: group.title,
                collapsed: group.collapsed,
                initCollapsed: group.collapsed,
                inputArray: inputArray
              } );

              return data;
            }, [] );
          }

          return data;
        } );

        /**
         * Returns an array of possible values for typeahead inputs
         */
        cenozo.addExtendableFunction( self, 'getTypeaheadData', function( input, viewValue ) {
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
            whereList.forEach( function( item ) {
              where.push( {
                column: item,
                operator: 'like',
                value: viewValue + '%',
                or: true
              } );
            } );
          }

          return {
            select: {
              column: [ 'id', {
                column: angular.isUndefined( input.typeahead.select ) ? 'name' : input.typeahead.select,
                alias: 'value',
                table_prefix: false
              } ]
            },
            modifier: { where: where }
          };
        } );

        /**
         * Returns an array of possible values for typeahead inputs
         */
        cenozo.addExtendableFunction( self, 'getTypeaheadValues', function( input, viewValue ) {
          // sanity checking
          if( angular.isUndefined( input ) )
            throw new Error( 'Typeahead used without a valid input key (' + key + ').' );
          if( 0 > ['typeahead','lookup-typeahead'].indexOf( input.type ) )
            throw new Error( 'Tried getting typeahead values for input of type "' + input.type + '".' );
          if( 'typeahead' == input.type ) {
            if( !angular.isArray( input.typeahead ) )
              throw new Error( 'Typeaheads require the input list\'s "typeahead" property to be an array.' );
          } else if ( 'lookup-typeahead' == input.type ) {
            if( !angular.isObject( input.typeahead ) )
              throw new Error(
                'Lookup-typeaheads require the input list\'s "typeahead" property to be an object.' );
          } else {
            throw new Error( 'Tried getting typeahead values for input of type "' + input.type + '".' );
          }

          if( 'typeahead' == input.type ) {
            var re = new RegExp( angular.lowercase( viewValue ) );
            return input.typeahead.filter( function( value ) { return re.test( angular.lowercase( value ) ); } );
          } else { // 'lookup-typeahead' == input.type
            // make note that we are loading the typeahead values
            input.typeahead.isLoading = true;

            return CnHttpFactory.instance( {
              path: input.typeahead.table,
              data: this.getTypeaheadData( input, viewValue )
            } ).get().then( function( response ) { return angular.copy( response.data ); } )
                     .finally( function() { input.typeahead.isLoading = false; } );
          }
        } );

        // enable/disable module functionality
        cenozo.addExtendableFunction( self, 'getAddEnabled', function() {
          return angular.isDefined( self.module.actions.add );
        } );
        cenozo.addExtendableFunction( self, 'getChooseEnabled', function() { return false; } );
        cenozo.addExtendableFunction( self, 'getDeleteEnabled', function() {
          return angular.isDefined( self.module.actions.delete );
        } );
        cenozo.addExtendableFunction( self, 'getEditEnabled', function() {
          return angular.isDefined( self.module.actions.edit );
        } );
        cenozo.addExtendableFunction( self, 'getListEnabled', function() {
          return angular.isDefined( self.module.actions.list );
        } );
        cenozo.addExtendableFunction( self, 'getViewEnabled', function() {
          return angular.isDefined( self.module.actions.view );
        } );

        /**
         * Loads the model's base metadata
         * 
         * Note: when extending this function with functions that update the metadata object after a
         * promise has been resolved it should be called in parallel to those promises using $q.all()
         * @return promise
         */
        cenozo.addExtendableFunction( self, 'getMetadata', function() {
          self.metadata.columnList = {};

          /* TODO: this is likely unnecessary, so remove it if no problems occur
          // Pre-build empty objects for every colum in all input groups
          // We do this so that if getMetadata is extended it can call this function and its own
          // in parallel instead of having to wait for this function's promise to resolve
          for( var group in self.module.inputGroupList )
            for( var column in self.module.inputGroupList[group].inputList )
              self.metadata.columnList[column] = {};
          */

          return CnHttpFactory.instance( {
            path: self.module.subject.snake
          } ).head().then( function( response ) {
            var columnList = angular.fromJson( response.headers( 'Columns' ) );
            for( var column in columnList ) {
              columnList[column].required = '1' == columnList[column].required;
              if( 'enum' == columnList[column].data_type ) { // parse out the enum values
                columnList[column].enumList = [];
                cenozo.parseEnumList( columnList[column] ).forEach( function( item ) {
                  columnList[column].enumList.push( { value: item, name: item } );
                } );
              }
              if( angular.isUndefined( self.metadata.columnList[column] ) )
                self.metadata.columnList[column] = {};
              angular.extend( self.metadata.columnList[column], columnList[column] );
            }
          } );
        } );

        /**
         * Determines whether a value meets its property's format
         * 
         * Note that if the value is null or an empty string then this test will pass as it
         * only returns a failed test response when there is something to test in the first place.
         * Failing a test due to a missing value is determined by the required parameter, not
         * format checking.
         */
        cenozo.addExtendableFunction( self, 'testFormat', function( property, value ) {
          var input = self.module.getInput( property );
          if( null === input || !value ) return true;

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
            var regexList = angular.isArray( input.regex ) ? input.regex : [ input.regex ];
            for( var i = 0; i < regexList.length; i++ ) {
              var re = new RegExp( regexList[i] );
              if( !re.test( value ) ) return false;
            }
          }

          // if we get here then the format is okay
          return true;
        } );

        /**
         * This function adds a column to the model which is used by the list model.
         * A separate copy of the column list is kept from the module as columns may need to
         * be added or removed at run-time
         */
        cenozo.addExtendableFunction( self, 'addColumn', function( key, column, index ) {
          column.key = key;
          if( angular.isUndefined( column.type ) ) column.type = 'string';
          var type = column.type;
          if( cenozo.isDatetimeType( type ) ) column.filter = 'cnDatetime:' + type;
          else if( 'rank' == type ) column.filter = 'cnOrdinal';
          else if( 'size' == type ) column.filter = 'cnSize';
          else if( 'boolean' == type ) column.filter = 'cnYesNo';
          else if( 'text' == type )
            column.filter = 'cnStub:' + ( angular.isDefined( column.limit ) ? column.limit : 10 );

          if( angular.isUndefined( index ) ) {
            // no index: add to existing Object
            self.columnList[key] = column;
          } else {
            // index: make new Object and add the column at the desired index
            var newColumnList = {};
            var currentIndex = 0;
            for( var k in self.columnList ) {
              if( currentIndex == index ) newColumnList[key] = column;
              newColumnList[k] = self.columnList[k];
              currentIndex++;
            }
            self.columnList = newColumnList;
          }
        } );

        ////////////////////////////////////////////////////////////////////////////////////////////
        // DEFINE ALL OBJECT PROPERTIES HERE
        ////////////////////////////////////////////////////////////////////////////////////////////
        self.module = module;

        // restructure and add helper functions to the identifier parent(s)
        if( angular.isDefined( self.module.identifier.parent ) ) {
          if( !angular.isArray( self.module.identifier.parent ) )
            self.module.identifier.parent = [ self.module.identifier.parent ];
          self.module.identifier.parent.forEach( function( item ) {
            item.alias = item.column.replace( '.', '_' );
            item.getIdentifier = function( record ) {
              var columnParts = this.column.split( '.' );
              var identifier = record[this.alias];
              if( 2 == columnParts.length ) identifier = columnParts[1] + '=' + identifier;
              return identifier;
            };
          } );
        }

        self.metadata = {
          getPromise: function() {
            if( angular.isUndefined( this.promise ) ) this.promise = self.getMetadata();
            return this.promise;
          }
        };
        self.enableListingState = 'list';
        // see the base list factory's orderBy function for how to use this variable
        self.queryParameterSubject = self.module.subject.snake;

        // process input and column lists one at a time
        self.columnList = {};
        for( var key in self.module.columnList ) self.addColumn( key, self.module.columnList[key] );
      }
    };
  }
] );

/* ######################################################################################################## */

/**
 * The base factory for History factories
 */
cenozo.factory( 'CnBaseHistoryFactory', [
  'CnSession', 'CnHttpFactory', '$state', '$q',
  function( CnSession, CnHttpFactory, $state, $q ) {
    return {
      construct: function( object, module, model ) {
        angular.extend( object, {
          module: module,
          model: model,

          viewNotes: function() {
            $state.go( module.subject.snake + '.notes', { identifier: $state.params.identifier } );
          },

          viewRecord: function() {
            $state.go( module.subject.snake + '.view', { identifier: $state.params.identifier } );
          },

          selectAllCategories: function() {
            for( var name in this.module.historyCategoryList ) {
              this.module.historyCategoryList[name].active = true;
            }
            this.model.reloadState( false, false );
          },

          unselectAllCategories: function() {
            for( var name in this.module.historyCategoryList ) {
              this.module.historyCategoryList[name].active = false;
            }
            this.model.reloadState( false, false );
          },

          toggleCategory: function( name ) {
            // update the query parameters with whatever the category's active state is
            this.model.setQueryParameter(
              name.toLowerCase(), this.module.historyCategoryList[name].active
            );
            this.model.reloadState( false, false );
          },

          getVisibleHistoryList: function() {
            var self = this;
            return this.historyList.filter( function( item ) {
              return self.module.historyCategoryList[item.category].active;
            } );
          },

          onView: function() {
            var self = this;
            this.historyList = [];

            // get all history category promises, run them and then sort the resulting history list
            var promiseList = [];
            for( var name in this.module.historyCategoryList ) {
              // sync the active parameter to the state while we're at it
              var active = this.model.getQueryParameter( name.toLowerCase() );
              this.module.historyCategoryList[name].active = angular.isDefined( active ) ? active : true;
              if( 'function' == cenozo.getType( this.module.historyCategoryList[name].promise ) ) {
                promiseList.push(
                  this.module.historyCategoryList[name].promise( this.historyList, $state, CnHttpFactory, $q )
                );
              }
            };

            return $q.all( promiseList ).then( function() {
              // convert invalid dates to null
              self.historyList.forEach( function( item ) {
                if( '0000-00-00' == item.datetime.substring( 0, 10 ) ) item.datetime = null;
              } );
              // sort the history list by datetime
              self.historyList = self.historyList.sort( function( a, b ) {
                return moment( new Date( a.datetime ) ).isBefore( new Date( b.datetime ) ) ? 1 : -1;
              } );
            } );
          }
        } );
      }
    };
  }
] );

/* ######################################################################################################## */

/**
 * The base factory for Note factories
 */
cenozo.factory( 'CnBaseNoteFactory', [
  'CnSession', 'CnHttpFactory', '$state',
  function( CnSession, CnHttpFactory, $state ) {
    return {
      construct: function( object, module ) {
        // Note: methods are added to Object here, members below
        angular.extend( object, {
          module: module,
          noteSubject: 'note',
          search: angular.isDefined( $state.params.search ) ? $state.params.search : '',
          newNote: '',
          noteListCache: [],
          noteList: [],
          allowDelete: module.allowNoteDelete,
          allowEdit: module.allowNoteEdit,

          updateSearch: function() {
            var self = this;
            $state.params.search = this.search;
            $state.transitionTo( $state.current, $state.params, { reload: false, notify: false } );
            this.noteList = this.noteListCache.filter( function( note ) {
              if( 0 == self.search.length ) {
                return true;
              } else {
                // convert search into modifier format
                return !self.search.split( ' ' ).some( function( word ) {
                  return 0 < word.length && !note.note.toLowerCase().includes( word.toLowerCase() );
                } );
              }
            } );
          },

          addNote: function() {
            var self = this;
            var note = {
              user_id: CnSession.user.id,
              datetime: moment().format(),
              note: this.newNote
            };

            CnHttpFactory.instance( {
              path: [ module.subject.snake, $state.params.identifier, this.noteSubject ].join( '/' ),
              data: note
            } ).post().then( function( response ) {
              note.id = response.data;
              note.sticky = false;
              note.noteBackup = note.note;
              note.userFirst = CnSession.user.firstName;
              note.userLast = CnSession.user.lastName;
              return note;
            } ).then( function( note ) {
              self.noteListCache.push( note );
              self.updateSearch( self.search );
            } );

            this.newNote = '';
          },

          deleteNote: function( id ) {
            var self = this;
            var index = this.noteListCache.findIndexByProperty( 'id', id );
            if( null !== index ) {
              CnHttpFactory.instance( {
                path: [
                  module.subject.snake,
                  $state.params.identifier,
                  this.noteSubject,
                  this.noteListCache[index].id
                ].join( '/' )
              } ).delete().then( function() {
                self.noteListCache.splice( index, 1 );
                self.updateSearch( self.search );
              } );
            }
          },

          noteChanged: function( id ) {
            var note = this.noteList.findByProperty( 'id', id );
            if( note ) {
              CnHttpFactory.instance( {
                path: [ module.subject.snake, $state.params.identifier, this.noteSubject, note.id ].join( '/' ),
                data: { note: note.note }
              } ).patch();
            }
          },

          stickyChanged: function( id ) {
            var note = this.noteList.findByProperty( 'id', id );
            if( note ) {
              note.sticky = !note.sticky;
              CnHttpFactory.instance( {
                path: [ module.subject.snake, $state.params.identifier, this.noteSubject, note.id ].join( '/' ),
                data: { sticky: note.sticky }
              } ).patch();
            }
          },

          undo: function( id ) {
            var note = this.noteList.findByProperty( 'id', id );
            if( note && note.note != note.noteBackup ) {
              note.note = note.noteBackup;
              CnHttpFactory.instance( {
                path: [ module.subject.snake, $state.params.identifier, this.noteSubject, note.id ].join( '/' ),
                data: { note: note.note }
              } ).patch();
            }
          },

          onView: function() {
            var self = this;
            this.isLoading = true;
            return CnHttpFactory.instance( {
              path: [ module.subject.snake, $state.params.identifier, this.noteSubject ].join( '/' ),
              data: {
                modifier: {
                  join: {
                    table: 'user',
                    onleft: this.noteSubject + '.user_id',
                    onright: 'user.id'
                  },
                  order: { 'datetime': true }
                },
                select: {
                  column: [ 'sticky', 'datetime', 'note', {
                    table: 'user',
                    column: 'first_name',
                    alias: 'user_first'
                  } , {
                    table: 'user',
                    column: 'last_name',
                    alias: 'user_last'
                  } ]
                }
              },
              redirectOnError: true
            } ).query().then( function( response ) {
              self.noteListCache = [];
              response.data.forEach( function( item ) {
                self.noteListCache.push( {
                  id: item.id,
                  datetime: '0000-00-00' == item.datetime.substring( 0, 10 ) ? null : item.datetime,
                  sticky: item.sticky,
                  userFirst: item.user_first,
                  userLast: item.user_last,
                  note: item.note,
                  noteBackup: item.note
                } );
              } );
              self.updateSearch( self.search );
            } ).finally( function() { self.isLoading = false; } );
          }
        } );

        if( angular.isDefined( module.actions.history ) ) {
          object.viewHistory = function() {
            $state.go( module.subject.snake + '.history', { identifier: $state.params.identifier } );
          };
        }

        if( angular.isDefined( module.actions.view ) ) {
          object.viewRecord = function() {
            $state.go( module.subject.snake + '.view', { identifier: $state.params.identifier } );
          };
        }
      }
    };
  }
] );

/* ######################################################################################################## */

/**
 * The master HTTP factory
 * 
 * All requests to the server's web API is done by creating an instance from this factory.
 */
cenozo.factory( 'CnHttpFactory', [
  'CnModalMessageFactory', '$http', '$state', '$rootScope', '$timeout', '$window',
  function( CnModalMessageFactory, $http, $state, $rootScope, $timeout, $window ) {
    function appendTransform( defaults, transform ) {
      defaults = angular.isArray(defaults) ? defaults : [defaults];
      return defaults.concat( transform );
    };

    // used top track current login credentials
    var login = { site: null, user: null, role: null };

    // used to track whether the login mismatch dialog has been shown
    var hasLoginMismatch = false;

    // used to track how to handle errors below
    var hasRedirectedOnError = false;

    var object = function( params ) {
      if( angular.isUndefined( params.path ) )
        throw new Error( 'Tried to create CnHttpFactory instance without a path' );

      this.path = null;
      this.data = {};
      this.redirectOnError = false;
      this.redirected = false;
      this.onError = CnModalMessageFactory.httpError;
      this.guid = cenozo.generateGUID();
      this.format = 'json';
      this.noActivity = true;
      angular.extend( this, params );

      var self = this;
      function http( method, url ) {
        var object = {
          url: cenozoApp.baseUrl + '/' + url,
          method: method,
          // broadcast when http requests start/finish
          transformRequest: appendTransform(
            $http.defaults.transformRequest,
            function( request ) {
              $rootScope.$broadcast( 'httpRequest', self.guid, request );
              return request;
            }
          ),
          transformResponse: appendTransform(
            $http.defaults.transformResponse,
            function( data, getHeader, status ) {
              var site = angular.fromJson( getHeader( 'Site' ) );
              var user = angular.fromJson( getHeader( 'User' ) );
              var role = angular.fromJson( getHeader( 'Role' ) );

              if( null == user ) {
                // our session has expired, reloading the page will bring us back to the login screen
                document.getElementById( 'view' ).innerHTML = '';
                $window.location.reload();
              } else {
                // assert login
                if( ( null != login.site && site != login.site ) ||
                    ( null != login.user && user != login.user ) ||
                    ( null != login.role && role != login.role ) ) {
                  var err = new Error;
                  err.name = 'Login Mismatch',
                  err.message =
                    'The server reports that you are no longer logged in as:\n' +
                    '\n' +
                    '        site: ' + login.site + '\n' +
                    '        user: ' + login.user + '\n' +
                    '        role: ' + login.role + '\n' +
                    '\n' +
                    'The application will now be reloaded after which you will be logged in as:\n' +
                    '\n' +
                    '        site: ' + site + '\n' +
                    '        user: ' + user + '\n' +
                    '        role: ' + role + '\n' +
                    '\n' +
                    'This should only happen as a result of accessing the application from a different ' +
                    'browser window.  If this message persists then please contact support as someone ' +
                    'else may be logged into your account.';
                  throw err;
                }

                $rootScope.$broadcast( 'httpResponse', self.guid, data );
              }

              return data;
            }
          )
        };

        if( null !== self.data ) {
          if( 'POST' == method || 'PATCH' == method ) object.data = self.data;
          else object.params = self.data;
        }

        if( 'csv' == self.format ) {
          object.responseType = 'arraybuffer';
          object.headers = { Accept: 'text/csv;charset=utf-8' };
        } else if( 'ods' == self.format ) {
          object.responseType = 'arraybuffer';
          object.headers = { Accept: 'application/vnd.oasis.opendocument.spreadsheet;charset=utf-8' };
        } else if( 'pdf' == self.format ) {
          object.responseType = 'arraybuffer';
          object.headers = { Accept: 'application/pdf' };
        } else if( 'xlsx' == self.format ) {
          object.responseType = 'arraybuffer';
          object.headers = {
            Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8'
          };
        } else {
          object.headers = {};
        }

        if( 'GET' == method || 'HEAD' == method ) object.headers['No-Activity'] = self.noActivity;

        var promise = $http( object )
        promise.catch( function( response ) {
          if( response instanceof Error ) {
            // blank content
            document.getElementById( 'view' ).innerHTML = '';

            if( 'Login Mismatch' == response.name ) {
              if( hasLoginMismatch ) return; // do nothing if we've already been here
              hasLoginMismatch = true;
            }
            CnModalMessageFactory.instance( {
              title: response.name,
              message: response.message,
              error: true
            } ).show().then( function() {
              if( hasLoginMismatch ) $window.location.assign( cenozoApp.baseUrl );
            } );
          } else {
            if( self.redirectOnError ) {
              // only redirect once, afterwords ignore any additional error redirect requests
              if( !hasRedirectedOnError && null == $state.current.name.match( /^error\./ ) ) {
                hasRedirectedOnError = true;
                $state.go(
                  'error.' + ( angular.isDefined( response ) ? response.status : 500 ),
                  response
                ).then( function() {
                  $timeout( function() { hasRedirectedOnError = false; }, 1000 );
                } );
              }
            } else {
              // wait a bit to make sure we don't have a batch of errors, because if one redirects then we
              // don't want to bother showing a non-redirecting error message
              $timeout( function() { if( !hasRedirectedOnError ) self.onError( response ); }, 200 );
            }
          }
        } );

        return promise;
      };

      this.delete = function() { return http( 'DELETE', 'api/' + this.path ); };
      this.get = function() { return http( 'GET', 'api/' + this.path ); };
      this.head = function() { return http( 'HEAD', 'api/' + this.path ); };
      this.patch = function() { return http( 'PATCH', 'api/' + this.path ); };
      this.post = function() { return http( 'POST', 'api/' + this.path ); };
      this.query = function() { return http( 'GET', 'api/' + this.path ); };
      this.count = function() {
        this.path += ( 0 <= this.path.indexOf( '?' ) ? '&' : '?' ) + 'count=true';
        return this.query();
      }
      this.file = function() {
        // change the default error
        if( this.onError === CnModalMessageFactory.httpError ) {
          this.onError = function( response ) {
            if( 404 == response.status ) {
              CnModalMessageFactory.instance( {
                title: 'File Not Found',
                message: 'Sorry, the file you are trying to download doesn\'t exist on the server.',
                error: true
              } ).show();
            } else CnModalMessageFactory.httpError( response );
          };
        }
        if( 'json' === this.format ) this.format = 'pdf';
        if( angular.isUndefined( this.data.download ) || !this.data.download ) this.data.download = true;
        return this.get().then( function( response ) {
          saveAs(
            new Blob(
              [response.data],
              { type: response.headers( 'Content-Type' ).replace( /"(.*)"/, '$1' ) }
            ),
            response.headers( 'Content-Disposition' ).match( /filename=(.*);/ )[1]
          );
        } );
      };
    };

    return {
      initialize: function( site, user, role ) {
        login.site = site;
        login.user = user;
        login.role = role;
      },
      instance: function( params ) { return new object( angular.isUndefined( params ) ? {} : params ); }
    };
  }
] );

/* ######################################################################################################## */

/**
 * A factory for showing account details in a modal window
 */
cenozo.service( 'CnModalAccountFactory', [
  '$modal',
  function( $modal ) {
    // track if the modal is already open
    var isOpen = false;

    var object = function( params ) {
      var self = this;
      this.allowCancel = true;
      angular.extend( this, params );

      if( angular.isUndefined( this.user ) )
        throw new Error( 'Tried to create CnModalAccountFactory instance without a user.' );

      this.show = function() {
        isOpen = true;
        return $modal.open( {
          backdrop: 'static',
          keyboard: this.allowCancel,
          modalFade: true,
          templateUrl: cenozo.getFileUrl( 'cenozo', 'modal-account.tpl.html' ),
          controller: function( $scope, $modalInstance ) {
            $scope.allowCancel = self.allowCancel;
            $scope.user = self.user;
            $scope.ok = function() {
              $modalInstance.close( true );
              isOpen = false;
            };
            $scope.cancel = function() {
              if( self.allowCancel ) {
                $modalInstance.close( false );
                isOpen = false;
              }
            };
            $scope.testEmailFormat = function() {
              $scope.form.email.$error.format = false === /^[^ ,]+@[^ ,]+\.[^ ,]{2,}$/.test( $scope.user.email );
              cenozo.updateFormElement( $scope.form.email, true );
            };
          }
        } ).result;
      };
    };

    return {
      instance: function( params ) { return new object( angular.isUndefined( params ) ? {} : params ); },
      isOpen: function() { return isOpen; }
    };
  }
] );

/* ######################################################################################################## */

/**
 * A factory for showing a yes/no confirmation dialog in a modal window
 */
cenozo.service( 'CnModalConfirmFactory', [
  '$modal',
  function( $modal ) {
    var object = function( params ) {
      var self = this;
      this.title = 'Confirm';
      this.message = 'Are you sure?';
      angular.extend( this, params );

      this.show = function() {
        return $modal.open( {
          backdrop: 'static',
          keyboard: true,
          modalFade: true,
          templateUrl: cenozo.getFileUrl( 'cenozo', 'modal-confirm.tpl.html' ),
          controller: function( $scope, $modalInstance ) {
            $scope.title = self.title;
            $scope.message = self.message;
            $scope.yes = function() { $modalInstance.close( true ); };
            $scope.no = function() { $modalInstance.close( false ); };
          }
        } ).result;
      };
    };

    return { instance: function( params ) { return new object( angular.isUndefined( params ) ? {} : params ); } };
  }
] );

/* ######################################################################################################## */

/**
 * A factory for showing a datetime picker in a modal window
 */
cenozo.service( 'CnModalDatetimeFactory', [
  '$modal', '$window', 'CnSession',
  function( $modal, $window, CnSession ) {
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
      };

      // service vars which can be defined by the contructor's params
      this.date = null;
      this.viewingDate = null;
      this.title = 'Title';
      this.pickerType = 'datetime';
      this.mode = 'day';
      this.emptyAllowed = true;
      this.minDate = null;
      this.maxDate = null;
      angular.extend( this, params );

      // service vars/functions which cannot be defined by the constructor's params

      // functions
      angular.extend( this, {
        getMinDate: function() {
          return 'now' === this.minDate
               ? cenozo.isDatetimeType( this.pickerType, 'timezone' ) ?
                   moment().tz( CnSession.user.timezone ) : moment()
               : ( null === this.minDate ? null : angular.copy( this.minDate ) );
        },
        isBeforeMinDate: function( date, granularity ) {
          if( angular.isUndefined( granularity ) ) granularity = 'second';
          var minDate = this.getMinDate();
          return null !== minDate && date.isBefore( minDate, granularity );
        },
        getMaxDate: function() {
          return 'now' === this.maxDate
               ? cenozo.isDatetimeType( this.pickerType, 'timezone' ) ?
                   moment().tz( CnSession.user.timezone ) : moment()
               : ( null === this.maxDate ? null : angular.copy( this.maxDate ) );
        },
        isAfterMaxDate: function( date, granularity ) {
          if( angular.isUndefined( granularity ) ) granularity = 'second';
          var maxDate = this.getMaxDate();
          return null !== maxDate && date.isAfter( maxDate, granularity );
        },
        isDateAllowed: function( date, granularity ) {
          if( this.isBeforeMinDate( date, granularity ) ) return false;
          if( this.isAfterMaxDate( date, granularity ) ) return false;
          return true;
        },
        resolveDate: function( date ) {
          if( this.isBeforeMinDate( date, 'second' ) ) {
            var utc = '+00:00' == date.format( 'Z' );
            date = this.getMinDate();
            if( utc ) date.tz( 'UTC' );
          }
          if( this.isAfterMaxDate( date, 'second' ) ) {
            var utc = '+00:00' == date.format( 'Z' );
            date = this.getMaxDate();
            if( utc ) date.tz( 'UTC' );
          }
          return date;
        },
        updateSlidersFromDate: function( date ) {
          this.hourSliderValue = date.format( 'H' );
          this.minuteSliderValue = date.format( 'm' );
          this.secondSliderValue = cenozo.isDatetimeType( this.pickerType, 'second' )
                                 ? date.format( 's' )
                                 : 0;
        },
        updateDateFromSliders: function() {
          // only change the time if the current day is within the min/max boundaries
          if( !this.isBeforeMinDate( this.date, 'day' ) && !this.isAfterMaxDate( this.date, 'day' ) ) {
            this.date.hour( this.hourSliderValue ).minute( this.minuteSliderValue ).second(
              cenozo.isDatetimeType( this.pickerType, 'second' ) ? this.secondSliderValue : 0 );
            this.date = this.resolveDate( this.date );
          }
          this.updateSlidersFromDate( this.date );
        },
        prevMode: function() {
          this.mode = 'year' == this.mode ? 'month' : 'day';
          this.update();
        },
        nextMode: function() {
          this.mode = 'day' == this.mode ? 'month' : 'year';
          this.update();
        },
        viewPrev: function() {
          var gap = viewMoveGaps[this.mode];
          this.viewingDate.subtract( gap.amount, gap.unit );
          this.update();
        },
        viewNext: function() {
          var gap = viewMoveGaps[this.mode];
          this.viewingDate.add( gap.amount, gap.unit );
          this.update();
        },
        select: function( when ) {
          if( 'now' == when ) {
            this.date = cenozo.isDatetimeType( this.pickerType, 'timezone' )
                      ? moment().tz( CnSession.user.timezone )
                      : moment();
            if( !cenozo.isDatetimeType( this.pickerType, 'second' ) ) this.date.second( 0 );
            this.updateSlidersFromDate( this.date );
          } else if( 'today' == when ) {
            this.date = cenozo.isDatetimeType( this.pickerType, 'timezone' )
                      ? moment().tz( CnSession.user.timezone )
                      : moment();
            this.updateDateFromSliders();
          } else {
            if( null === when ) {
              this.date = null;
            } else {
              if( null === this.date ) {
                this.date = cenozo.isDatetimeType( this.pickerType, 'timezone' )
                          ? moment().tz( CnSession.user.timezone )
                          : moment();
                this.updateDateFromSliders();
              }
              this.date.year( when.year() ).month( when.month() ).date( when.date() );
              this.updateDateFromSliders();
            }
          }

          if( null !== this.date ) this.viewingDate = moment( this.date );
          this.prevMode(); // will call update()
        },
        updateDisplayTime: function() {
          this.displayTime = null === this.date ? '(empty)' :
            this.date.format(
              CnSession.getTimeFormat(
                cenozo.isDatetimeType( this.pickerType, 'second' ),
                !cenozo.isDatetimeType( this.pickerType, 'time' ) &&
                cenozo.isDatetimeType( this.pickerType, 'timezone' )
              )
            );
        },
        update: function() {
          if( 'time' != this.pickerType && 'time_notz' != this.pickerType ) {
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
                  disabled: !this.isDateAllowed( cellDate, 'day' )
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
                  disabled: !this.isDateAllowed( cellDate, 'day' )
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
                  disabled: !this.isDateAllowed( cellDate, 'month' )
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
                  disabled: !this.isDateAllowed( cellDate, 'year' )
                } );
              }

              this.cellList = split( cellList, 5 );
            }
          }

          this.updateDisplayTime();

          // need to send a resize event so the sliders update
          $window.dispatchEvent( new Event( 'resize' ) );
        },
        show: function() {
          return $modal.open( {
            backdrop: 'static',
            keyboard: true,
            modalFade: true,
            templateUrl: cenozo.getFileUrl( 'cenozo', 'modal-datetime.tpl.html' ),
            controller: function( $scope, $modalInstance ) {
              $scope.local = self;
              $scope.nowDisabled = !self.isDateAllowed( moment(), 'second' );
              $scope.todayDisabled = !self.isDateAllowed( moment(), 'day' );
              $scope.ok = function() {
                var response = null;
                if( null !== $scope.local.date ) {
                  var format =
                    'time' == self.pickerType || 'time_notz' == self.pickerType ? 'HH:mm' :
                    'timesecond' == self.pickerType || 'timesecond_notz' == self.pickerType ? 'HH:mm:ss' :
                    undefined;
                  response = cenozo.isDatetimeType( self.pickerType, 'timezone' )
                           ? $scope.local.date.tz( 'utc' ).format( format )
                           : $scope.local.date.format( format );
                }
                $modalInstance.close( response );
              };
              $scope.cancel = function() { $modalInstance.close( false ); };

              $scope.$watch( 'local.hourSliderValue', function( hour ) {
                if( 'moment' == cenozo.getType( $scope.local.date ) ) {
                  $scope.local.updateDateFromSliders();
                  $scope.local.updateDisplayTime();
                }
              } );
              $scope.$watch( 'local.minuteSliderValue', function( minute ) {
                if( 'moment' == cenozo.getType( $scope.local.date ) ) {
                  $scope.local.updateDateFromSliders();
                  $scope.local.updateDisplayTime();
                }
              } );
              $scope.$watch( 'local.secondSliderValue', function( second ) {
                if( 'moment' == cenozo.getType( $scope.local.date ) ) {
                  $scope.local.updateDateFromSliders();
                  $scope.local.updateDisplayTime();
                }
              } );
            }
          } ).result;
        }
      } );

      // process the boundary dates
      if( angular.isUndefined( this.minDate ) || null === this.minDate ) this.minDate = null;
      else if( 'now' !== this.minDate ) {
        if( /^[0-9][0-9]?:[0-9][0-9](:[0-9][0-9])?/.test( this.minDate ) )
          this.minDate = moment().format( 'YYYY-MM-DD' ) + 'T' + this.minDate + 'Z';
        this.minDate = moment( new Date( this.minDate ) );
        if( cenozo.isDatetimeType( this.pickerType, 'timezone' ) ) this.minDate.tz( CnSession.user.timezone );
      }
      if( angular.isUndefined( this.maxDate ) || null === this.maxDate ) this.maxDate = null;
      else if( 'now' !== this.maxDate ) {
        if( /^[0-9][0-9]?:[0-9][0-9](:[0-9][0-9])?/.test( this.maxDate ) ) {
          this.maxDate = moment().format( 'YYYY-MM-DD' ) + 'T' + this.maxDate + 'Z';
        }
        this.maxDate = moment( new Date( this.maxDate ) );
        if( cenozo.isDatetimeType( this.pickerType, 'timezone' ) ) this.maxDate.tz( CnSession.user.timezone );
      }

      // treat invalid dates as null dates
      if( angular.isString( this.date ) && '0000-00-00' == this.date.substring( 0, 10 ) ) this.date = null;

      // process the input (starting) date
      if( null === this.date ) {
        this.viewingDate = this.resolveDate(
          cenozo.isDatetimeType( this.pickerType, 'timezone' ) ?
            moment().tz( CnSession.user.timezone ) : moment()
        );
      } else {
        if( angular.isUndefined( this.date ) ) {
          this.date = this.resolveDate(
            cenozo.isDatetimeType( this.pickerType, 'timezone' ) ?
              moment().tz( CnSession.user.timezone ) : moment()
          );

          // round to the next hour
          this.date.minute( 0 ).second( 0 ).millisecond( 0 ).add( 1, 'hours' );
        } else {
          if( /^[0-9][0-9]?:[0-9][0-9](:[0-9][0-9])?/.test( this.date ) ) {
            this.date = moment().format( 'YYYY-MM-DD' ) + 'T' + this.date + 'Z';
          }
          this.date = moment( new Date( this.date ) );
        }

        if( cenozo.isDatetimeType( this.pickerType, 'timezone' ) ) this.date.tz( CnSession.user.timezone );
        this.viewingDate = moment( this.date );
      }

      // for the time picker we might have to adjust the min/max dates
      if( cenozo.isDatetimeType( this.pickerType, 'time' ) ) {
        if( 'moment' == cenozo.getType( this.minDate ) ) this.minDate.date( this.date.date() );
        if( 'moment' == cenozo.getType( this.maxDate ) ) this.maxDate.date( this.date.date() );
      }

      this.modeTitle = '';
      this.displayTime = '';
      this.updateSlidersFromDate( this.viewingDate );
      this.update();
    };

    return { instance: function( params ) { return new object( angular.isUndefined( params ) ? {} : params ); } };
  }
] );

/* ######################################################################################################## */

/**
 * A factory for showing a message dialog in a modal window
 */
cenozo.service( 'CnModalMessageFactory', [
  '$modal',
  function( $modal ) {
    var object = function( params ) {
      var self = this;
      this.title = 'Title';
      this.message = 'Message';
      this.error = false;
      this.block = false;
      angular.extend( this, params );

      this.show = function() {
        self.modal = $modal.open( {
          backdrop: 'static',
          keyboard: !self.block,
          modalFade: true,
          templateUrl: cenozo.getFileUrl( 'cenozo', 'modal-message.tpl.html' ),
          controller: function( $scope, $modalInstance ) {
            $scope.title = self.title;
            $scope.message = self.message;
            $scope.error = self.error;
            $scope.block = self.block;
            $scope.close = function() { $modalInstance.close( false ); };
          }
        } );

        return self.modal.result;
      };

      this.close = function() { if( angular.isDefined( this.modal ) ) this.modal.close( false ); };
    };

    return {
      instance: function( params ) { return new object( angular.isUndefined( params ) ? {} : params ); },
      httpError: function( response ) {
        var type = angular.isDefined( response ) && angular.isDefined( response.status )
                 ? response.status : 500;
        var title = 'Error';
        var message = 'Unfortunately your request cannot be processed ';

        if( 306 == type && angular.isDefined( response.data ) ) {
          title = 'Please Note';
          message = response.data;
        } else if( 403 == type ) {
          title = 'Permission Denied';
          message += 'because you do not have access to the requested resource.';
        } else if( 404 == type ) {
          title = 'Not Found';
          message += 'because the needed resource could not be found.';
        } else if( 406 == type ) {
          title = 'Format Unavailable';
          message += 'because the requested format is not available.';
        } else if( 409 == type ) {
          title = 'Conflict';
          message += 'due to a pre-existing conflict.';
        } else {
          title = 'Server Error';
          message += 'due to a server-based error. Please provide the resource and error code to support.';
        }
        message += '\n';

        if( angular.isDefined( response.config ) ) {
          // add the url to the message
          var re = new RegExp( '^' + cenozoApp.baseUrl + '/(api/?)?' );
          message += '\n    Resource: "' + response.config.method + ':'
                   + response.config.url.replace( re, '' ) + '"';

          if( angular.isDefined( response.config.params ) )
            message += '\n    Parameters: ' + angular.toJson( response.config.params );
        }
        if( 'string' == cenozo.getType( response.data ) &&
            0 < response.data.length &&
            306 != type && 406 != type ) message += '\n    Error Code: ' + response.data;
        var modal = new object( { title: title, message: message, error: true } );
        return modal.show();
      }
    };
  }
] );

/* ######################################################################################################## */

/**
 * A factory for showing a message password changing dialog in a modal window
 */
cenozo.service( 'CnModalPasswordFactory', [
  '$modal',
  function( $modal ) {
    // track if the modal is already open
    var isOpen = false;

    var object = function( params ) {
      var self = this;
      this.confirm = true;
      this.showCancel = false;
      this.showPasswords = false;
      angular.extend( this, params );
      if( this.confirm ) this.showCancel = true;

      this.show = function() {
        isOpen = true;
        return $modal.open( {
          backdrop: 'static',
          keyboard: this.confirm,
          modalFade: true,
          templateUrl: cenozo.getFileUrl( 'cenozo', 'modal-password.tpl.html' ),
          controller: function( $scope, $modalInstance ) {
            $scope.confirm = self.confirm;
            $scope.showCancel = self.showCancel;
            $scope.showPasswords = self.showPasswords;
            $scope.ok = function() {
              $modalInstance.close( {
                currentPass: $scope.currentPass,
                requestedPass: $scope.newPass1
              } );
              isOpen = false;
            };
            $scope.cancel = function() {
              if( this.showCancel ) {
                $modalInstance.close( false );
                isOpen = false;
              }
            };
            $scope.checkPasswordMatch = function() {
              var match = true;
              var item1 = $scope.form.newPass1;
              var item2 = $scope.form.newPass2;
              if( item1.$dirty && item2.$dirty ) {
                if( ( item1.$error.noMatch || !item1.$invalid ) &&
                    ( item2.$error.noMatch || !item2.$invalid ) ) {
                  var match = $scope.newPass1 === $scope.newPass2;
                  item1.$error.noMatch = !match;
                  cenozo.updateFormElement( item1, false );
                  item2.$error.noMatch = !match;
                  cenozo.updateFormElement( item2, false );
                }
              }

              return match;
            };
            $scope.toggleShowPasswords = function() {
              $scope.showPasswords = !$scope.showPasswords;
            };
          }
        } ).result;
      };
    };

    return {
      instance: function( params ) { return new object( angular.isUndefined( params ) ? {} : params ); },
      isOpen: function() { return isOpen; }
    };
  }
] );

/* ######################################################################################################## */

/**
 * A factory for showing a column restriction dialog in a modal window
 */
cenozo.service( 'CnModalRestrictFactory', [
  '$modal', 'CnModalDatetimeFactory', 'CnSession',
  function( $modal, CnModalDatetimeFactory, CnSession ) {
    var object = function( params ) {
      var self = this;
      if( angular.isUndefined( params.column ) )
        throw new Error( 'Tried to create CnModalRestrictFactory instance without a column.' );

      this.name = null;
      this.column = null;
      this.type = 'string';
      angular.extend( this, params );
      if( 'text' == this.type ) this.type = 'string';
      if( !angular.isArray( this.emptyList ) ) this.emptyList = [];
      if( !angular.isArray( this.restrictList ) ) this.restrictList = [];

      this.getInitialValue = function() {
        if( 'string' == this.type ) return '';
        else if( cenozo.isDatetimeType( this.type ) ) return null;
        return 1; // boolean, number, size, rank
      };

      this.addRestriction = function() {
        var restriction = { test: '<=>', value: this.getInitialValue() };
        if( 'size' == this.type ) restriction.unit = 'Bytes';
        if( 0 < this.restrictList.length ) restriction.logic = 'and';
        this.restrictList.push( restriction );
        this.emptyList.push( { isEmpty: false } );
        this.describeRestriction( this.restrictList.length - 1 );
      };

      this.updateEmpty = function( index ) {
        // first make sure the empty list is correct
        this.emptyList[index].isEmpty = null === this.restrictList[index].value;
      }

      this.removeRestriction = function( index ) {
        this.restrictList.splice( index, 1 );
        this.emptyList.splice( index, 1 );
      };

      this.describeRestriction = function( index ) {
        this.restrictList[index].description = CnSession.describeRestriction(
          this.type,
          this.restrictList[index].test,
          this.restrictList[index].value,
          this.restrictList[index].unit
        );
      }

      this.toggleEmpty = function( index ) {
        if( this.emptyList[index].isEmpty ) {
          this.restrictList[index].value = angular.isUndefined( this.emptyList[index].oldValue )
                                         ? this.getInitialValue()
                                         : this.emptyList[index].oldValue;
          if( null == this.restrictList[index].value && cenozo.isDatetimeType( this.type ) ) {
            var date = moment().tz( 'utc' );
            if( !cenozo.isDatetimeType( this.type, 'second' ) ) date.second( 0 );
            this.restrictList[index].value = date.format();
          }
        } else {
          this.emptyList[index].oldValue = this.restrictList[index].value;
          this.restrictList[index].value = null;
          // make sure to select <=> or <>
          if( 0 > ['<=>','<>'].indexOf( this.restrictList[index].test ) )
            this.restrictList[index].test = '<=>';
        }

        this.formattedValueList[index] =
          CnSession.formatValue( this.restrictList[index].value, this.type, true );
        this.describeRestriction( index );
      };

      this.preExisting = 0 < this.restrictList.length;
      if( 0 == this.restrictList.length ) this.addRestriction();
      this.formattedValueList = [];
      this.restrictList.forEach( function( item, index ) {
        this.emptyList[index] = { isEmpty: null === item.value };
        if( angular.isDefined( item.value ) )
          this.formattedValueList[index] = CnSession.formatValue( item.value, this.type, true );
      }, this );

      this.show = function() {
        return $modal.open( {
          backdrop: 'static',
          keyboard: true,
          modalFade: true,
          templateUrl: cenozo.getFileUrl( 'cenozo', 'modal-restrict.tpl.html' ),
          controller: function( $scope, $modalInstance ) {
            $scope.local = self;
            $scope.ok = function( restrictList ) {
              // remove restrictions with no values before returning the list
              restrictList.filter( function( item ) { return angular.isDefined( item ); } );

              // make sure the first item in the list has no logic set
              if( 0 < restrictList.length && angular.isDefined( restrictList[0].logic ) )
                delete restrictList[0].logic;

              $modalInstance.close( restrictList );
            };
            $scope.remove = function() { $modalInstance.close( [] ); };
            $scope.cancel = function() { $modalInstance.dismiss( 'cancel' ); };

            if( cenozo.isDatetimeType( $scope.local.type ) ) {
              $scope.selectDatetime = function( index ) {
                CnModalDatetimeFactory.instance( {
                  title: self.column,
                  date: self.restrictList[index].value,
                  pickerType: self.type,
                  emptyAllowed: true
                } ).show().then( function( response ) {
                  if( false !== response ) {
                    self.restrictList[index].value = response;
                    self.formattedValueList[index] =
                      CnSession.formatValue( self.restrictList[index].value, self.type, true );

                    // set non-nullable options disabled/enabled status
                    var optionList = document.querySelector( 'select[name="test' + index + '"]' ).
                                     getElementsByClassName( 'not-nullable' );
                    if( angular.isArray( optionList ) )
                      optionList.map( function( item ) { item.disabled = null === response } );

                    // update the empty list
                    self.updateEmpty( index );

                    // describe the restriction
                    self.describeRestriction( index );
                  }
                } );
              };
            }
          }
        } ).result;
      };
    };

    return { instance: function( params ) { return new object( angular.isUndefined( params ) ? {} : params ); } };
  }
] );

/* ######################################################################################################## */

/**
 * A factory for showing a list of sites in a modal window
 */
cenozo.service( 'CnModalSiteFactory', [
  '$modal', 'CnSession',
  function( $modal, CnSession ) {
    var object = function( params ) {
      var self = this;
      angular.extend( this, params );
      this.show = function() {
        return $modal.open( {
          backdrop: 'static',
          keyboard: true,
          modalFade: true,
          templateUrl: cenozo.getFileUrl( 'cenozo', 'modal-site.tpl.html' ),
          controller: function( $scope, $modalInstance ) {
            // load the data from the session once it is available
            $scope.siteList = CnSession.siteList;
            $scope.siteId = self.id;

            $scope.ok = function() { $modalInstance.close( $scope.siteId ); };
            $scope.cancel = function() { $modalInstance.close( false ); };
          }
        } ).result;
      };
    };

    return { instance: function( params ) { return new object( angular.isUndefined( params ) ? {} : params ); } };
  }
] );

/* ######################################################################################################## */

/**
 * A factory for changing the current site and role in a modal window
 */
cenozo.service( 'CnModalSiteRoleFactory', [
  '$modal', 'CnHttpFactory',
  function( $modal, CnHttpFactory ) {
    var object = function( params ) {
      var self = this;
      angular.extend( this, params );

      this.show = function() {
        return $modal.open( {
          backdrop: 'static',
          keyboard: true,
          modalFade: true,
          templateUrl: cenozo.getFileUrl( 'cenozo', 'modal-site-role.tpl.html' ),
          controller: function( $scope, $modalInstance ) {
            $scope.refreshRoleList = function() {
              this.siteList.forEach( function( item, index ) {
                if( this.siteId == item.id ) this.roleList = item.roleList;
              }, this );
              this.roleId = this.roleList[0].id;
            };

            $scope.ok = function() {
              $modalInstance.close( {
                siteId: $scope.siteId,
                roleId: $scope.roleId
              } );
            };
            $scope.cancel = function() { $modalInstance.close( false ); };

            $scope.siteList = [];
            $scope.loading = true;

            // get access records
            CnHttpFactory.instance( {
              path: 'self/0/access'
            } ).get().then( function( response ) {
              response.data.forEach( function( access ) {
                // get the site, or add it if it's missing, then add the role to the site's role list
                var site = $scope.siteList.findByProperty( 'id', access.site_id );
                if( null == site ) {
                  site = {
                    id: access.site_id,
                    name: access.site_name,
                    timezone: access.timezone,
                    roleList: []
                  };
                  $scope.siteList.push( site );
                }
                site.roleList.push( { id: access.role_id, name: access.role_name } );
              } );

              // set the site, refresh the role list then set the role (must be in this order)
              $scope.siteId = self.siteId ? self.siteId : $scope.siteList[0].id;
              $scope.refreshRoleList();
              if( self.roleId ) $scope.roleId = self.roleId;
              $scope.loading = false;
            } );
          }
        } ).result;
      };
    };

    return { instance: function( params ) { return new object( angular.isUndefined( params ) ? {} : params ); } };
  }
] );

/* ######################################################################################################## */

/**
 * A factory for showing a modal window with a textarea input
 */
cenozo.service( 'CnModalTextFactory', [
  '$modal',
  function( $modal ) {
    var object = function( params ) {
      var self = this;
      this.title = 'Provide Text';
      this.message = 'Please provide details:';
      this.text = '';
      this.minLength = 0;
      angular.extend( this, params );

      this.show = function() {
        return $modal.open( {
          backdrop: 'static',
          keyboard: true,
          modalFade: true,
          templateUrl: cenozo.getFileUrl( 'cenozo', 'modal-text.tpl.html' ),
          controller: function( $scope, $modalInstance ) {
            $scope.title = self.title;
            $scope.message = self.message;
            $scope.text = self.text;
            $scope.minLength = self.minLength;
            $scope.ok = function() {
              $modalInstance.close( angular.isUndefined( $scope.text ) ? '' : $scope.text );
            };
            $scope.cancel = function() { $modalInstance.close( false ); };
          }
        } ).result;
      };
    };

    return { instance: function( params ) { return new object( angular.isUndefined( params ) ? {} : params ); } };
  }
] );

/* ######################################################################################################## */

/**
 * A factory for changing the current timezone in a modal window
 */
cenozo.service( 'CnModalTimezoneFactory', [
  '$modal', 'CnSession',
  function( $modal, CnSession ) {
    var object = function( params ) {
      var self = this;

      this.timezone = null;
      this.use12hourClock = false;
      angular.extend( this, params );

      this.show = function() {
        return $modal.open( {
          backdrop: 'static',
          keyboard: true,
          modalFade: true,
          templateUrl: cenozo.getFileUrl( 'cenozo', 'modal-timezone.tpl.html' ),
          controller: function( $scope, $modalInstance ) {
            $scope.timezone = self.timezone;
            $scope.use12hourClock = self.use12hourClock ? 1 : 0;
            $scope.timezoneList = moment.tz.names();

            $scope.getTypeaheadValues = function( viewValue ) {
              var re = new RegExp( angular.lowercase( viewValue ) );
              return $scope.timezoneList.filter( function( value ) {
                return re.test( angular.lowercase( value ) );
              } );
            };

            $scope.siteTimezone = function() {
              $scope.timezone = CnSession.site.timezone;
            };

            $scope.ok = function() {
              $modalInstance.close( {
                timezone: $scope.timezone,
                // need to convert boolean to integer for select dropdown
                use12hourClock: 1 == parseInt( $scope.use12hourClock )
              } );
            };
            $scope.cancel = function() { $modalInstance.close( false ); };
          }
        } ).result;
      };
    };

    return { instance: function( params ) { return new object( angular.isUndefined( params ) ? {} : params ); } };
  }
] );

/* ######################################################################################################## */

/**
 * Creates a pagination widget for paging through lists
 */
cenozo.factory( 'CnPaginationFactory',
  function() {
    var object = function( params ) {
      this.currentPage = 1;
      this.showPageLimit = 5;
      this.itemsPerPage = 20;
      this.changePage = function() {};
      angular.extend( this, params );

      this.getLimitTo = function( minOffset, cacheLength ) {
        return ( this.currentPage - 1 ) * this.itemsPerPage - minOffset - cacheLength;
      };
      this.getMinIndex = function() { return ( this.currentPage - 1 ) * this.itemsPerPage; };
      this.getMaxIndex = function() { return this.currentPage * this.itemsPerPage - 1; };
    };

    return { instance: function( params ) { return new object( angular.isUndefined( params ) ? {} : params ); } };
  }
);

/* ######################################################################################################## */

/**
 * Launches scripts in a separate tab
 * 
 * Note: use CnSession.closeScript() to close the tab opened by this factory's launch() function
 */
cenozo.factory( 'CnScriptLauncherFactory', [
  'CnSession', 'CnHttpFactory', 'CnModalMessageFactory', '$q', '$window',
  function( CnSession, CnHttpFactory, CnModalMessageFactory, $q, $window ) {
    var object = function( params ) {
      var self = this;

      this.lang = 'en';
      if( angular.isUndefined( params.script ) )
        throw new Error( 'Tried to create CnScriptLauncherFactory instance without a script' );
      if( angular.isUndefined( params.script.url ) )
        throw new Error( 'Tried to create CnScriptLauncherFactory instance without a script.url' );
      if( angular.isUndefined( params.identifier ) )
        throw new Error( 'Tried to create CnScriptLauncherFactory instance without a identifier' );
      angular.extend( this, params );
      this.token = undefined;
      this.deferred = $q.defer();

      CnHttpFactory.instance( {
        path: 'script/' + self.script.id + '/token/' + self.identifier,
        data: { select: { column: [ 'token', 'completed' ] } },
        onError: function( response ) {
          // ignore 404
          if( 404 == response.status ) {
            console.info( 'The "404 (Not Found)" error found above is normal and can be ignored.' );
            self.token = null;
            if( angular.isDefined( self.onReady ) ) self.onReady();
            self.deferred.resolve();
          } else {
            CnModalMessageFactory.httpError( response );
          }
        }
      } ).get().then( function( response ) {
        self.token = response.data;
        if( angular.isDefined( self.onReady ) ) self.onReady();
        self.deferred.resolve();
      } );

      this.launch = function() {
        var url = self.script.url + '&lang=' + self.lang + '&newtest=Y';

        return this.deferred.promise.then( function() {
          if( null == self.token ) {
            // the token doesn't exist so create it
            var modal = CnModalMessageFactory.instance( {
              title: 'Please Wait',
              message: 'Please wait while the participant\'s data is retrieved.',
              block: true
            } );
            modal.show();

            return CnHttpFactory.instance( {
              path: 'script/' + self.script.id + '/token',
              data: { identifier: self.identifier },
              onError: function( response ) {
                modal.close();
                CnModalMessageFactory.httpError( response );
              }
            } ).post().then( function( response ) {
              // close the wait message
              modal.close();

              // now get the new token string we just created and use it to open the script window
              return CnHttpFactory.instance( {
                path: 'script/' + self.script.id + '/token/' + response.data
              } ).get().then( function( response ) {
                self.token = { token: response.data.token, completed: 'N' };

                // launch the script
                CnSession.scriptWindowHandler =
                  $window.open( url + '&token=' + self.token.token, 'cenozoScript' );
              } );
            } );
          } else {
            // launch the script
            CnSession.scriptWindowHandler =
              $window.open( url + '&token=' + self.token.token, 'cenozoScript' );
          }
        } );
      }
    };

    return { instance: function( params ) { return new object( angular.isUndefined( params ) ? {} : params ); } };
  }
] );

/* ######################################################################################################## */

/**
 * Configures Cenozo's providers and sets up various configurations
 */
cenozo.config( [
  '$controllerProvider', '$compileProvider', '$filterProvider', '$locationProvider',
  '$provide', '$tooltipProvider', '$urlRouterProvider', '$httpProvider',
  function( $controllerProvider, $compileProvider, $filterProvider, $locationProvider,
            $provide, $tooltipProvider, $urlRouterProvider, $httpProvider ) {
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

    // load the 404 state when a state is not found for the provided path
    $urlRouterProvider.otherwise( function( $injector, $location ) {
      $injector.get( '$state' ).go( 'error.404' );
      return $location.path();
    } );

    // set the default tooltip delay
    $tooltipProvider.options( { popupDelay: 500 } );

    // turn on html5 mode
    $locationProvider.html5Mode( true );

    $httpProvider.defaults.headers.common.Accept = 'application/json;charset=utf-8';
  }
] );

/* ######################################################################################################## */

/**
 * Adds callbacks to various events, primarily for logging
 */
cenozo.run( [
  '$state', '$rootScope', 'CnSession',
  function( $state, $rootScope, CnSession ) {
    // track whether we're transitioning a state due to an error (to avoid infinite loops)
    var stateErrorTransition = false;

    $rootScope.$on( '$stateChangeStart', function( event, toState, toParams, fromState, fromParams ) {
      console.info(
        'Changing state from %s to %s',
        fromState.name ? fromState.name + angular.toJson( fromParams ) : '(none)',
        toState.name ? toState.name + angular.toJson( toParams ) : '(none)'
      );
      CnSession.setBreadcrumbTrail( [ { title: 'Loading\u2026' } ] );
      if( 0 < CnSession.working ) CnSession.transitionWhileWorking = true;
    } );
    $rootScope.$on( '$stateChangeSuccess', function( event, toState, toParams, fromState, fromParams ) {
      if( angular.isUndefined( toState ) ) {
        CnSession.pageTitle = 'Home';
      } else {
        CnSession.pageTitle = toState.name.split( '.' ).filter( function( item ) {
          return 'root' != item;
        } ).map( function( item ) {
          return item.replace( /_/, ' ' ).replace( /\b./g, function( match ) { return match.toUpperCase(); } );
        } ).join( ' / ' );
      }

      CnSession.pageTitle = ': ' + CnSession.pageTitle;
      if( angular.isDefined( toParams ) && angular.isDefined( toParams.identifier ) )
        CnSession.pageTitle += ' / ' + String( toParams.identifier ).split( '=' ).pop();

      // store the last state and params in the state object
      $state.last = fromState;
      $state.lastParams = fromParams;

      console.info( 'Completed state change to %s',
        toState.name ? toState.name + angular.toJson( toParams ) : '(none)'
      );

      if( stateErrorTransition ) stateErrorTransition = false;
    } );
    $rootScope.$on( '$stateNotFound', function( event, unfoundState, fromState, fromParams ) {
      if( !stateErrorTransition ) {
        stateErrorTransition = true;
        CnSession.workingTransition( function() { $state.go( 'error.state' ) } );
      }
    } );
    $rootScope.$on( '$stateChangeError', function( event, toState, toParams, fromState, fromParams, error ) {
      if( !stateErrorTransition ) {
        stateErrorTransition = true;
        CnSession.workingTransition( function() { $state.go( 'error.404' ) } );
      }
    } );
    $rootScope.$on( 'httpRequest', function( event, guid, request ) {
      CnSession.updateWorkingGUID( guid, true );
    } );
    $rootScope.$on( 'httpResponse', function( event, guid, response ) {
      CnSession.updateWorkingGUID( guid, false );
    } );
  }
] );

window.cenozo = cenozo;
window.cenozoApp = cenozoApp;

} )( window, document );
