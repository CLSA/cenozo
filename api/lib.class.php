<?php
/**
 * lib.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo
 * @filesource
 */

namespace cenozo;

/**
 * lib: dynamic class loading functionality
 *
 * @package cenozo
 */
final class lib
{
  /**
   * Constructor (or not)
   * 
   * This method is kept private so that no one ever tries to instantiate it.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access private
   */
  private function __construct() {}

  /**
   * Registers this class with PHP as an autoloader.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $operation_type The type of operation being performe
   * @param boolean $development_mode Whether the system is in development mode
   * @static
   * @access public
   */
  public static function register( $operation_type, $development_mode )
  {
    if( !self::$registered )
    {
      self::$registered = true;
      self::$operation_type = $operation_type;
      self::$development_mode = $development_mode;
      ini_set( 'unserialize_callback_func', 'spl_autoload_call' );
      spl_autoload_register( array( new self, 'autoload' ) );
    }
  }

  /**
   * Object factory building method.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $class_name The type of object to create, including all but the base
   *        (framework or application) namespace.
   * @param mixed $arg1 The first argument to pass to the constructor
   * @param mixed $arg2 The second argument to pass to the constructor
   * @param mixed $arg3 The third argument to pass to the constructor
   * @param mixed $arg4 Etc...
   * @access public
   */
  public static function create( $class_name )
  {
    $debug = 'business\session' == $class_name;
    // remove the class name from the arguments
    $a = func_get_args();
    $class_name = array_shift( $a );
    $count = count( $a );

    // determine the full class name
    $class_name = self::get_class_name( $class_name );

    if( is_subclass_of( $class_name, 'cenozo\singleton' ) ||
        is_subclass_of( $class_name, 'cenozo\factory' ) )
    {
      if( 0 == $count ) return $class_name::self();
      if( 1 == $count ) return $class_name::self( $a[0] );
      if( 2 == $count ) return $class_name::self( $a[0], $a[1] );
      if( 3 == $count ) return $class_name::self( $a[0], $a[1], $a[2] );
      if( 4 == $count ) return $class_name::self( $a[0], $a[1], $a[2], $a[3] );
      if( 5 == $count ) return $class_name::self( $a[0], $a[1], $a[2], $a[3], $a[4] );
      if( 6 == $count ) return $class_name::self( $a[0], $a[1], $a[2], $a[3], $a[4],
                                                  $a[5] );
      if( 7 == $count ) return $class_name::self( $a[0], $a[1], $a[2], $a[3], $a[4],
                                                  $a[5], $a[6] );
      if( 8 == $count ) return $class_name::self( $a[0], $a[1], $a[2], $a[3], $a[4],
                                                  $a[5], $a[6], $a[7] );
      if( 9 == $count ) return $class_name::self( $a[0], $a[1], $a[2], $a[3], $a[4],
                                                  $a[5], $a[6], $a[7], $a[8] );
  
      // limit to 10 arguments
      return $class_name::self( $a[0], $a[1], $a[2], $a[3], $a[4],
                                $a[5], $a[6], $a[7], $a[8], $a[9] );
    }

    if( 0 == $count ) return new $class_name();
    if( 1 == $count ) return new $class_name( $a[0] );
    if( 2 == $count ) return new $class_name( $a[0], $a[1] );
    if( 3 == $count ) return new $class_name( $a[0], $a[1], $a[2] );
    if( 4 == $count ) return new $class_name( $a[0], $a[1], $a[2], $a[3] );
    if( 5 == $count ) return new $class_name( $a[0], $a[1], $a[2], $a[3], $a[4] );
    if( 6 == $count ) return new $class_name( $a[0], $a[1], $a[2], $a[3], $a[4],
                                              $a[5] );
    if( 7 == $count ) return new $class_name( $a[0], $a[1], $a[2], $a[3], $a[4],
                                              $a[5], $a[6] );
    if( 8 == $count ) return new $class_name( $a[0], $a[1], $a[2], $a[3], $a[4],
                                              $a[5], $a[6], $a[7] );
    if( 9 == $count ) return new $class_name( $a[0], $a[1], $a[2], $a[3], $a[4],
                                              $a[5], $a[6], $a[7], $a[8] );

    // limit to 10 arguments
    return new $class_name( $a[0], $a[1], $a[2], $a[3], $a[4],
                            $a[5], $a[6], $a[7], $a[8], $a[9] );
  }

  /**
   * This method is called by PHP whenever an undefined class is used.
   * It searches for an appropriate file in the application's api directory and loads it,
   * or if no file is found then it searches in the cenozo api directory.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @static
   * @throws exception\runtime
   * @access public
   */
  public static function autoload( $class_name )
  {
    // only work on classes in the cenozo or application namespace
    if( false === strpos( $class_name, 'cenozo\\' ) &&
        false === strpos( $class_name, APPNAME.'\\' ) ) return;

    // If we are loading a class from the application namespace then we must also include
    // the same class from the framework, if one exists.
    // This is the only way to allow an application class to extend a framework class by
    // the same name and namespace.
    $pos = strpos( $class_name, APPNAME.'\\' );
    if( false !== $pos )
    {
      $cenozo_class_name =
        'cenozo\\'.substr( $class_name, $pos + strlen( APPNAME.'\\' ) );
      if( !class_exists( $cenozo_class_name, false ) )
      {
        $cenozo_file_path = self::get_full_class_path( $cenozo_class_name, true );
        if( !is_null( $cenozo_file_path ) )
        {
          require $cenozo_file_path;
          if( !class_exists( $cenozo_class_name, false ) )
            throw self::create(
              'exception\runtime', 'Unable to load class: '.$cenozo_class_name, __METHOD__ );
        }
      }
    }

    // now go ahead and include the requested class file
    $file_path = self::get_full_class_path( $class_name );
    if( !is_null( $file_path ) )
    {
      require $file_path;
      if( !class_exists( $class_name, false ) && !interface_exists( $class_name, false ) )
        throw self::create( 'exception\runtime', 'Unable to load class: '.$class_name, __METHOD__ );

      return;
    }

    // if we get here then the file is missing
    throw self::create( 'exception\runtime', 'Missing class: '.$class_name, __METHOD__ );
  }

  /**
   * Returns the full path of the class.  This method searches for a matching filename to the class
   * in the application, then if none is found it searches again in the cenozo framework.
   * NOTE: This method is final because it is called explicitely by the autoloader (ie: extended
   * versions of this class cannot override this method)
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $class_name The name of the class including the namespace but without the base
   *               (application) name (so api\ui\widget and not cenozo\api\ui\widget)
   * @param boolean $force_framework_namespace Whether to force the class file to be loaded from
   *                the framework and not the application.
   * @return string (NULL if file not found)
   * @access public
   * @static
   */
  public static function get_full_class_path( $class_name, $force_framework_namespace = false )
  {
    if( !$force_framework_namespace )
    {
      $file_path = self::get_application_class_path( $class_name );
      if( !is_null( $file_path ) ) return $file_path;
    }

    $file_path = self::get_framework_class_path( $class_name );
    if( !is_null( $file_path ) ) return $file_path;

    // no such file
    return NULL;
  }
  
  /**
   * Returns the full name of the class including namespace.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $class_name The name of the class including the namespace but without the base
   *               (application) namespace.
   * @return string
   * @access public
   * @throws exception\runtime
   * @static
   */
  public static function get_class_name( $class_name )
  {
    $class_in_application = !is_null( self::get_application_class_path( $class_name ) );
    $class_in_framework = !is_null( self::get_framework_class_path( $class_name ) );

    // make sure the class exists in either the application or the framework
    if( !$class_in_application && !$class_in_framework )
    {
      throw self::create( 'exception\runtime',
        sprintf( 'Class name %s doesn\'t exist in either the application or framework.',
                 $class_name ), __METHOD__ );
    }

    // if the path is null then return back the argument
    return sprintf( '\\%s\\%s',
                    $class_in_application ? APPNAME : 'cenozo',
                    $class_name );
  }

  /**
   * If the application has a file corresponding to the given class name then this method
   * will return the path to that class, or NULL if no such file exists.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access protected
   * @static
   */
  protected static function get_application_class_path( $class_name )
  {
    // replace back-slashes with forward-slashes
    $class_name = str_replace( '\\', '/', $class_name );
    
    // if the base of the namespace is cenozo or the application name then remove it
    if( false !== strpos( $class_name, 'cenozo/' ) ||
        false !== strpos( $class_name, APPNAME.'/' ) )
    {
      $class_name = substr( $class_name, strpos( $class_name, '/' ) + 1 );
    }

    // see if the application has a matching class
    $file_path = sprintf( '%s/%s.class.php', API_PATH, $class_name );
    if( file_exists( $file_path ) )
    {
      return $file_path;
    }

    // see if the application has a matching interface
    $file_path = sprintf( '%s/%s.interface.php', API_PATH, $class_name );
    if( file_exists( $file_path ) ) return $file_path;

    return NULL;
  }

  /**
   * If the framework has a file corresponding to the given class name then this method
   * will return the path to that class, or NULL if no such file exists.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access protected
   * @static
   */
  protected static function get_framework_class_path( $class_name )
  {
    // replace back-slashes with forward-slashes
    $class_name = str_replace( '\\', '/', $class_name );
    
    // if the base of the namespace is cenozo or the application name then remove it
    if( false !== strpos( $class_name, 'cenozo/' ) ||
        false !== strpos( $class_name, APPNAME.'/' ) )
    {
      $class_name = substr( $class_name, strpos( $class_name, '/' ) + 1 );
    }

    // see if the application has a matching class
    $file_path = sprintf( '%s/%s.class.php', CENOZO_API_PATH, $class_name );
    if( file_exists( $file_path ) ) return $file_path;

    // see if the application has a matching interface
    $file_path = sprintf( '%s/%s.interface.php', CENOZO_API_PATH, $class_name );
    if( file_exists( $file_path ) ) return $file_path;

    return NULL;
  }

  /**
   * Returns the type of operation being performed.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @static
   * @return string
   * @access public
   */
  public static function get_operation_type()
  {
    return self::$operation_type;
  }

  /**
   * Returns whether the application is in development mode.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @static
   * @return boolean
   * @access public
   */
  public static function in_development_mode()
  {
    return self::$development_mode;
  }

  /**
   * The type of operation being performed.
   * @var string
   * @access protected
   * @static
   */
  protected static $operation_type = NULL;

  /**
   * Whether the application is in development mode
   * @var boolean
   * @access protected
   * @static
   */
  protected static $development_mode = NULL;

  /**
   * Used to track whether the util class has been registered.
   * @var boolean
   * @access protected
   * @static
   */
  protected static $registered = false;
}
?>
