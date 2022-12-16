<?php
/**
 * service.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * The base class for all services.
 *
 * All service classes extend this base service class.  All classes that extend this class are
 * used to fulfill some purpose executed by the user or machine interfaces.
 */
abstract class service extends \cenozo\base_object
{
  /**
   * Returns the associated database service for the provided service.
   * 
   * In addition to constructing the service object, the service is also validated against the
   * user's current role's access.
   * @param string $method The request's method (DELETE, GET, HEAD, PATCH, POST)
   * @param string $path The URL of the service (not including the base)
   * @param array $args An associative array of arguments included in the request
   * @param string $file The raw file posted by PATCH and POST requests
   * @access public
   */
  public function __construct( $method, $path, $args = NULL, $file = NULL )
  {
    $this->path = $path;
    $this->method = strtoupper( $method );
    $this->arguments = $args;
    if( !is_array( $this->arguments ) ) $this->arguments = array();
    $this->file = $file;

    // now process the path and mime type
    $code = $this->process_path( $path );
    if( 400 != $code && !self::is_method( $method ) ) $code = 405;
    $this->status = lib::create( 'service\status', $code );
  }

  /**
   * Processes the service by doing the following stages:
   * 1. prepare:  processes path and arguments, preparing them for the service
   * 2. validate: checks to make sure the arguments are valid, the user has access, etc
   * 3. setup:    a pre-execution phase that sets up the service
   * 4. execute:  execution of the service, completing the task
   * 5. finish:   a post-execution phase that finishes extra tasks after execution
   * 
   * @access public
   */
  public function process()
  {
    $util_class_name = lib::get_class_name( 'util' );

    try
    {
      if( self::$debug ) $time['begin'] = $util_class_name::get_elapsed_time();

      if( !$this->may_continue() ) return;
      $this->prepare();
      if( self::$debug ) $time['prepare'] = $util_class_name::get_elapsed_time();

      if( !$this->may_continue() ) return;
      $this->validate();
      if( self::$debug ) $time['validate'] = $util_class_name::get_elapsed_time();

      if( !$this->may_continue() ) return;
      $this->setup();
      if( self::$debug ) $time['setup'] = $util_class_name::get_elapsed_time();

      if( !$this->may_continue() ) return;
      $this->execute();
      if( self::$debug ) $time['execute'] = $util_class_name::get_elapsed_time();

      if( !$this->may_continue() ) return;
      $this->finish();
      if( self::$debug ) $time['finish'] = $util_class_name::get_elapsed_time();

      if( self::$debug )
      {
        log::debug( sprintf( '[%s] %s times: (%s) => (%s)',
                             $this->method,
                             $this->path,
                             implode( ', ', array_keys( $time ) ),
                             implode( ', ', array_values( $time ) ) ) );
      }
    }
    catch( \cenozo\exception\notice $e )
    {
      $this->status->set_location( NULL );
      $this->set_data( $e->get_notice() );
      $this->status->set_code( 306 );
    }
  }

  /**
   * Processes arguments, preparing them for the service.
   * 
   * @access protected
   */
  protected function prepare()
  {
    $util_class_name = lib::get_class_name( 'util' );
    $session = lib::create( 'business\session' );
    $db_user = $session->get_user();
    $db_site = $session->get_site();
    $db_role = $session->get_role();

    // go through all collection/resource pairs
    foreach( $this->collection_name_list as $index => $subject )
    {
      if( array_key_exists( $index, $this->resource_value_list ) )
      {
        $record = $this->get_resource( $index );

        if( is_null( $record ) )
        {
          $this->status->set_code( 404 );
          break;
        }
        else
        {
          // ensure that this resource belongs to the parent record (if there is one)
          if( 0 < $index )
          {
            // get the parent record and test to see if this record is one of its children
            $parent_record = $this->get_resource( $index - 1 );
            $method_name = sprintf( 'get_%s_count', $subject );
            $modifier = lib::create( 'database\modifier' );
            $primary_key_name = $record::get_primary_key_name();
            $modifier->where(
              sprintf( '%s.%s', $record::get_table_name(), $primary_key_name ),
              '=', $record->$primary_key_name );
            if( 0 == $parent_record->$method_name( $modifier ) )
            {
              $this->status->set_code( 404 );
              break;
            }
          }
        }
      }
    }

    if( 404 != $this->status->get_code() &&
        in_array( $this->method, array( 'DELETE', 'POST' ) ) &&
        'self' != $this->get_leaf_subject() )
    { // record to the write log if the method is of write type
      $this->db_writelog = lib::create( 'database\writelog' );
      $this->db_writelog->user_id = $db_user->id;
      $this->db_writelog->site_id = $db_site->id;
      $this->db_writelog->role_id = $db_role->id;
      $this->db_writelog->method = $this->method;
      $this->db_writelog->path = $this->path;
      $this->db_writelog->datetime = $util_class_name::get_datetime_object();
      $this->db_writelog->save();
    }
  }

  /**
   * Validate the service.  If validation fails the service's status code will be set.
   * 
   * Validation works by checking each collection/resource pair and making sure the current role
   * has access to it.  For non-leaf pairs the method "GET" is checked.  For the leaf pair the
   * service's method is used instead.
   * @access protected
   */
  protected function validate()
  {
    $relationship_class_name = lib::get_class_name( 'database\relationship' );
    $service_class_name = lib::get_class_name( 'database\service' );
    $session = lib::create( 'business\session' );

    // only the login/logout services can be processed while not logged in
    if( is_null( $session->get_user() ) &&
        !( 'self' == $this->get_subject( 0 ) && in_array( $this->method, array( 'DELETE', 'POST' ) ) ) )
    {
      $this->status->set_code( 204 );
    }
    else if( $this->validate_access )
    {
      // check access for each collection/resource pair
      $parent_subject = NULL;
      $many_to_many = $relationship_class_name::MANY_TO_MANY === $this->get_leaf_parent_relationship();
      foreach( $this->collection_name_list as $index => $subject )
      {
        $has_resource = array_key_exists( $index, $this->resource_value_list );
        $method = 'GET';

        // for the leaf it depends on whether there is a many-to-many relationship with the parent
        if( $index == count( $this->collection_name_list ) - 1 && !$many_to_many ) $method = $this->method;
        if( 'HEAD' == $method ) $method = 'GET'; // HEAD access is based on GET access

        $db_service = $service_class_name::get_unique_record(
          array( 'method', 'subject', 'resource' ),
          array( $method, $subject, $has_resource ) );

        // make sure the service exists, is allowed and the module validates
        if( is_null( $db_service ) )
        {
          $this->status->set_code( 404 );
          break;
        }
        else if( 'HEAD' != $this->method && 'self' != $this->get_subject( 0 ) )
        { // only validate non-HEAD methods when the root subject isn't "self"
          if( !$session->is_service_allowed( $db_service ) ) $this->status->set_code( 403 );
          else $this->module_list[$index]->validate();
        }

        // don't bother continuing if we've got an error
        if( !$this->may_continue() ) break;

        $parent_subject = $subject;
      }
    }

    // check if the requested mime type exists
    if( false === $this->get_mime_type() ) $this->status->set_code( 406 );
  }

  /**
   * Sets up the service with any pre-execution instructions that may be necessary.
   * 
   * @access protected
   */
  protected function setup() {}

  /**
   * This method executes the service's purpose.  All services must implement this method.
   * 
   * @access protected
   */
  protected function execute() {}

  /**
   * Finishes the service with any post-execution instructions that may be necessary.
   * 
   * @access protected
   */
  protected function finish()
  {
    // set the content type and length headers, if the service has produced output
    $mime_type = $this->get_mime_type();
    $this->headers['Content-Type'] = $mime_type;
    $this->headers['Content-Length'] = strlen( $this->get_data() );

    $is_text = 1 === preg_match( '#^text/#', $mime_type );

    // use Windows-1252 charset when returning a CSV file <sarcasm>Thanks Microsoft!</sarcasm>
    if( $is_text ) $this->headers['Content-Type'] .= '; charset=Windows-1252';

    if( false !== strpos( $mime_type, 'application/' ) || false !== strpos( $mime_type, 'image/' ) || $is_text )
    {
      $this->headers['Content-Disposition'] = sprintf( 'attachment; filename="%s";', $this->get_filename() );
      $this->headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      $this->headers['Pragma'] = 'no-cache';
      $this->headers['Expires'] = '0';

      if( false !== strpos( $mime_type, 'application/vnd' ) )
      {
        $this->headers['Content-Type'] = 'application/octet-stream';
        $this->headers['Content-Transfer-Encoding'] = 'binary';
      }
      else if( 'application/zip' == $mime_type )
      {
        $this->headers['Content-Type'] = 'application/octet-stream';
      }
    }

    if( $this->temporary_login ) lib::create( 'business\session' )->logout();
  }

  /**
   * Closes the writelog created by the service by adding the elapsed time and status
   * 
   * @access public
   */
  public function close_writelog()
  {
    if( !is_null( $this->db_writelog ) )
    {
      $util_class_name = lib::get_class_name( 'util' );
      $this->db_writelog->elapsed = $util_class_name::get_elapsed_time();
      $this->db_writelog->status = $this->status->get_code();
      $this->db_writelog->save();
    }
  }

  /**
   * Converts the service's path into a a list of collection and resource names.
   * 
   * This method will return false if there was a problem processing the path
   * @param string $path
   * @return http status code
   * @access protected
   */
  protected function process_path( $path )
  {
    $code = 200;

    $session = lib::create( 'business\session' );

    $this->collection_name_list = array();
    $this->resource_value_list = array();
    $this->module_list = array();

    // run the login sequence for all services except the login/logout services
    if( !( 'self/0' == $path && in_array( $this->method, array( 'DELETE', 'POST' ) ) ) )
    {
      // if there is an authorization header and we aren't already logged in, then do so now and note that
      // we are using a temporary (one-use) login
      $user = NULL;
      $pass = NULL;
      if( is_null( $session->get_user() ) &&
          $session->check_authorization_header( $user, $pass ) &&
          $session->login( $user ) ) $this->temporary_login = true;

      if( is_null( $session->get_user() ) ||
          // don't allow users with no role any access except to confirm basic information about their account
          ( is_null( $session->get_role() ) && 'GET' != $this->method ) ) $code = 401;
    }

    if( $this->may_continue() && 0 < strlen( $path ) )
    {
      $module_index = 0;
      foreach( explode( '/', $path ) as $index => $part )
      {
        if( 0 == strlen( $part ) )
        {
          $code = 400;
          break;
        }

        if( 0 == $index % 2 )
        {
          $this->collection_name_list[] = $part;
          try
          {
            $this->module_list[] = lib::create( sprintf( 'service\%s\module', $part ), $module_index, $this );
          }
          catch( \cenozo\exception\runtime $e )
          {
            $code = 404;
            break;
          }
          $module_index++;
        }
        else $this->resource_value_list[] = $part;
      }
    }

    if( !$this->may_continue() )
    {
      $this->collection_name_list = array();
      $this->resource_value_list = array();
      $this->module_list = array();
    }

    return $code;
  }

  /**
   * Returns the service's path
   * 
   * @return string
   * @access public
   */
  public function get_path() { return $this->path; }

  /**
   * Returns the service's method
   * 
   * @return string
   * @access public
   */
  public function get_method() { return $this->method; }

  /**
   * Returns the number of collections in the service
   * 
   * @return integer
   * @access public
   */
  public function get_number_of_collections()
  {
    return count( $this->collection_name_list );
  }

  /**
   * Returns the subject for a particular index
   * 
   * The index is based on the service's path.  Every other item in the path identifies a
   * collection by name (string).  For instance, for the path /collection/1/participant/2
   * the first subject is "collection" and the second is "participant".  Null is returned
   * if there is no subject for the given index.
   * 
   * @param integer $index
   * @return string
   * @access public
   */
  public function get_subject( $index )
  {
    return array_key_exists( $index, $this->collection_name_list ) ? $this->collection_name_list[$index] : NULL;
  }

  /**
   * Returns the resource value for a particular index
   * 
   * @param integer $index
   * @return string
   * @access public
   */
  public function get_resource_value( $index )
  {
    return array_key_exists( $index, $this->resource_value_list ) ? $this->resource_value_list[$index] : NULL;
  }

  /**
   * Returns the record's class name by index
   * 
   * @param integer $index
   * @param boolean $relative Whether to return the relative class name (without full path)
   * @return string
   * @access public
   */
  public function get_record_class_name( $index, $relative = false )
  {
    $subject = $this->get_subject( $index );
    if( is_null( $subject ) )
      throw lib::create( 'exception\runtime',
        sprintf( 'Tried to get record class name for invalid subject (index: %d)', $index ),
        __METHOD__ );

    $class = sprintf( 'database\%s', $subject );
    return $relative ? $class : lib::get_class_name( $class );
  }

  /**
   * Returns the resource for a particular index
   * 
   * The index is based on the service's path.  Every other item in the path identifies a
   * resource either by ID or some other set of key/value pair(s).  For instance, for the
   * path /collection/1/participant/2 the first resource would be a collection for ID 1
   * and the second a participant for ID 2.  Null is returned if there is no resource for
   * the given index.
   * 
   * @param integer $index
   * @return database\record
   * @access public
   * @final
   */
  public final function get_resource( $index )
  {
    if( !array_key_exists( $index, $this->resource_cache ) )
      $this->resource_cache[$index] = $this->create_resource( $index );
    return $this->resource_cache[$index];
  }

  /**
   * Creates the resource for a given index (almost always a database record)
   * 
   * @param integer $index
   * @return database\record|mixed The created resource
   * @access protected
   */
  protected function create_resource( $index )
  {
    $session = lib::create( 'business\session' );

    $record = NULL;

    if( array_key_exists( $index, $this->collection_name_list ) &&
        array_key_exists( $index, $this->resource_value_list ) )
    {
      $subject = $this->collection_name_list[$index];
      $resource_value = $this->resource_value_list[$index];

      $util_class_name = lib::get_class_name( 'util' );
      $record_class_name = $this->get_record_class_name( $index );

      // if the resource value has key=value pairs and has a parent then add the parent ID
      $parent_index = $index - 1;
      if( 1 == preg_match( '/^[^=;]+=[^=;]+(;[^=;]+=[^=;]+)*$/', $resource_value ) && 0 <= $parent_index )
      {
        $parent_record = $this->get_resource( $parent_index );
        $resource_value .= sprintf( ';%s_id=%s', $parent_record->get_class_name(), $parent_record->id );
      }

      try
      {
        $record = $record_class_name::get_record_from_identifier( $resource_value );
      }
      catch( \cenozo\exception\notice $e )
      {
        $this->set_data( $e->get_notice() );
        $this->status->set_code( 306 );
      }
      // ignore runtime exceptions and instead just return a null record
      catch( \cenozo\exception\runtime $e ) {}
    }

    return $record;
  }

  /**
   * Returns the resource of the second-to-last collection (based on the service's path)
   * 
   * @return string If there is no parent subject then NULL is returned
   * @access protected
   */
  protected function get_parent_record()
  {
    $count = count( $this->collection_name_list );
    return 1 < $count ? $this->get_resource( $count - 2 ) : NULL;
  }

  /**
   * Returns the subject of the last collection (based on the service's path)
   * 
   * @return string If there is no leaf subject then NULL is returned
   * @access public
   */
  public function get_leaf_subject()
  {
    return $this->get_subject( count( $this->collection_name_list ) - 1 );
  }

  /**
   * Returns the subject of the second-to-last collection (based on the service's path)
   * 
   * @return string If there is no parent subject then NULL is returned
   * @access public
   */
  public function get_parent_subject()
  {
    return $this->get_subject( count( $this->collection_name_list ) - 2 );
  }

  /**
   * Returns the leaf record's class name
   * 
   * @return string
   * @access public
   */
  public function get_leaf_record_class_name()
  {
    return $this->get_record_class_name( count( $this->collection_name_list ) - 1 );
  }

  /**
   * Returns the resource of the last collection (based on the service's path)
   * 
   * @return string If there is no leaf subject then NULL is returned
   * @access public
   */
  public function get_leaf_record()
  {
    $count = count( $this->collection_name_list );
    return 0 < $count ? $this->get_resource( $count - 1 ) : NULL;
  }

  /**
   * Returns the module of the last collection (based on the service's path)
   * 
   * @return module If there is no leaf subject then NULL is returned
   * @access protected
   */
  protected function get_leaf_module()
  {
    $count = count( $this->collection_name_list );
    return 0 < $count ? $this->module_list[$count - 1] : NULL;
  }

  /**
   * Returns the database relationship between the leaf and its parent
   * 
   * @return int See database\relationship for list of possible values
   * @access public
   */
  public function get_leaf_parent_relationship()
  {
    $parent_record = $this->get_parent_record();
    return is_null( $parent_record ) ? NULL : $parent_record::get_relationship( $this->get_leaf_subject() );
  }

  /**
   * Returns the file provided to the service (unchanged)
   * 
   * @access public
   */
  public function get_file_as_raw()
  {
    return $this->file;
  }

  /**
   * Returns the file provided to the service decoded as an object
   * 
   * @access public
   */
  public function get_file_as_object()
  {
    if( null === $this->file_as_object )
    {
      $util_class_name = lib::get_class_name( 'util' );
      $this->file_as_object = $util_class_name::json_decode( $this->file );
    }

    return $this->file_as_object;
  }

  /**
   * Returns the file provided to the service decoded as an associate array
   * 
   * @access public
   */
  public function get_file_as_array()
  {
    if( null === $this->file_as_array )
    {
      $object = $this->get_file_as_object();
      if( !is_null( $object ) ) $this->file_as_array = get_object_vars( $object );
    }

    return $this->file_as_array;
  }

  /**
   * Get a query argument passed to the service.
   * 
   * @param string $name The name of the argument.
   * @param mixed $default The value to return if no argument exists.  If the default is null then
   *                       it is assumed that the argument must exist, throwing an argument
                           exception if it is not set.
   * @return mixed
   * @throws exception\argument
   * @access protected
   */
  public function get_argument( $name, $default = NULL )
  {
    $argument = NULL;
    if( !array_key_exists( $name, $this->arguments ) )
    {
      if( 1 == func_num_args() )
      {
        $this->status->set_code( 400 );
        throw lib::create( 'exception\argument', $name, NULL, __METHOD__ );
      }
      $argument = $default;
    }
    else
    { // the argument exists
      $argument = $this->arguments[$name];
    }

    return $argument;
  }

  /**
   * Returns the http status
   * @return service\status
   * @access public
   */
  public function get_status() { return $this->status; }

  /**
   * Returns any headers generated by the service.
   * @return array( mixed )
   * @access public
   */
  public function get_headers() { return $this->headers; }

  /**
   * Returns a list of mime types supported by the service
   * @return array
   * @access public
   */
  public function get_supported_mime_type_list()
  {
    // supported mime types
    return array(
      'application/json',
      'application/pdf',
      'application/vnd.oasis.opendocument.spreadsheet',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain'
    );
  }

  /**
   * Returns the most preferred valid mime type from the request headers
   * @return string
   * @access public
   */
  public function get_mime_type()
  {
    if( is_null( $this->mime_type ) )
    {
      // determine the encoding from the accept header
      $headers = apache_request_headers();
      if( false === $headers )
        throw lib::create( 'exception\runtime', 'Unable to decode request headers', __METHOD__ );

      $mime_type_list = $this->get_supported_mime_type_list();

      if( array_key_exists( 'Accept', $headers ) )
      {
        // order accept arguments into three categories: no wildcards, one wildcard and two wildcards
        $parsed_accept = array( array(), array(), array() );
        foreach( array_map( 'trim', explode( ',', $headers['Accept'] ) ) as $type )
        {
          // remove additional accept parameters, they are ignored
          $parts = explode( ';', $type );
          $media = array_shift( $parts );

          // sort by the number of times a wildcard is used
          $index = substr_count( $media, '*' );
          if( 3 > $index ) $parsed_accept[$index][] = $media;
        }

        // now find the highest-ranking accept which matches one of the available mime types
        $this->mime_type = NULL;
        foreach( $parsed_accept as $accept_list )
        {
          foreach( $accept_list as $accept )
          {
            $e = sprintf( '#%s#', str_replace( '*', '.+', $accept ) );
            foreach( $mime_type_list as $mime_type )
            {
              if( 1 === preg_match( $e, $mime_type ) )
              {
                $this->mime_type = $mime_type;
                break;
              }
            }
            if( !is_null( $this->mime_type ) ) break;
          }
          if( !is_null( $this->mime_type ) ) break;
        }
      }
      else
      {
        // no preference, so use the first in the list
        $this->mime_type = current( $mime_type_list );
      }
    }

    return $this->mime_type;
  }

  /**
   * Returns the filename to be used when the service sets the content disposition header
   * @return mixed
   * @access public
   */
  protected function get_filename()
  {
    $filename = ucwords( str_replace( '_', ' ', $this->get_leaf_subject() ) );
    $parent_subject = $this->get_parent_subject();
    if( !is_null( $parent_subject ) )
      $filename = ucwords( str_replace( '_', ' ', $parent_subject ) ).' - '.$filename;

    // now get the extension
    $mime_type = $this->get_mime_type();
    if( 'application/json' == $mime_type ) $filename .= '.json';
    else if( 'application/pdf' == $mime_type ) $filename .= '.pdf';
    else if( 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' == $mime_type )
      $filename .= '.xlsx';
    else if( 'application/vnd.oasis.opendocument.spreadsheet' == $mime_type )
      $filename .= '.ods';
    else if( 'text/csv' == $mime_type ) $filename .= '.csv';
    else if( 'text/plain' == $mime_type ) $filename .= '.txt';

    return $filename;
  }

  /**
   * Returns any data generated by the service encoded according to the Accept header
   * @return mixed
   * @access public
   */
  public function get_data()
  {
    $util_class_name = lib::get_class_name( 'util' );

    if( is_null( $this->encoded_data ) )
    {
      $this->encoded_data = $this->data;

      if( $this->encode )
      {
        $mime_type = $this->get_mime_type();

        // when not returning json data remove id column from data, if found
        if( 'application/json' != $mime_type && is_array( $this->encoded_data ) )
        {
          foreach( $this->encoded_data as $index => $row )
          {
            if( 'id' === $index ) unset( $this->encoded_data[$index] );
            else if( is_array( $row ) )
            {
              foreach( $row as $column => $cell )
                if( 'id' === $column ) unset( $this->encoded_data[$index][$column] );
            }
          }
        }

        if( 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' == $mime_type ||
                 'application/vnd.oasis.opendocument.spreadsheet' == $mime_type )
        {
          $spreadsheet = lib::create( 'business\spreadsheet' );
          $spreadsheet->load_data( $this->encoded_data );
          $this->encoded_data = $spreadsheet->get_file( $mime_type );
        }
        else if( 'text/csv' == $mime_type )
        {
          $this->encoded_data = $util_class_name::get_data_as_csv( $this->encoded_data );
        }
        else if( 'text/plain' == $mime_type )
        {
          $this->encoded_data = $util_class_name::convert_charset( $this->encoded_data );
        }
        else // 'application/json' == $encoding
        {
          $this->encoded_data = is_null( $this->encoded_data ) ? '' : $util_class_name::json_encode( $this->encoded_data );
        }
      }
    }

    return $this->encoded_data;
  }

  /**
   * Sets the data returned by the service.
   * @param mixed $data
   * @access public
   */
  public function set_data( $data )
  {
    $this->data = $data;
    $this->encoded_data = NULL;
  }

  /**
   * Returns whether the request is still valid (IE: its code is < 300 and not 204 (logged out))
   * @return boolean
   */
  public function may_continue()
  {
    // if there is no status yet then we can continue
    if( is_null( $this->status ) ) return true;

    // the request will not continue if the status is 204 (since the user isn't logged in) or >= 300
    $code = $this->status->get_code();
    return 204 != $code && 300 > $code;
  }

  /**
   * Gets whether to check if the user has access to the service
   * @return boolean
   * @access protected
   */
  protected function get_validate_access()
  {
    return $this->validate_access;
  }

  /**
   * Sets whether to check if the user has access to the service
   * @param boolean $access
   * @access protected
   */
  protected function set_validate_access( $access )
  {
    $this->validate_access = $access;
  }

  /**
   * Returns whether or not a method is valid
   * @param $method string
   * @return boolean
   * @access public
   * @static
   */
  public static function is_method( $method )
  {
    $method = strtoupper( $method );
    return array_key_exists( $method, self::$method_list );
  }

  /**
   * Returns whether or not a method is valid and read-based
   * @param $method string
   * @return boolean
   * @access public
   * @static
   */
  public static function is_read_method( $method )
  {
    $method = strtoupper( $method );
    return array_key_exists( $method, self::$method_list ) && !self::$method_list[$method];
  }

  /**
   * Returns whether or not a method is valid and write-based
   * @param $method string
   * @return boolean
   * @access public
   * @static
   */
  public static function is_write_method( $method )
  {
    $method = strtoupper( $method );
    return array_key_exists( $method, self::$method_list ) && self::$method_list[$method];
  }

  /**
   * When set to true all service processes will report elapsed times to the debug log
   * @var boolean
   * @static
   * @access public
   */
  public static $debug = false;

  /**
   * Header data generated by the service (if any).
   * @var array( mixed )
   * @access protected
   */
  protected $headers = array();

  /**
   * Data generated by the service (if any).
   * @var mixed
   * @access protected
   */
  protected $data = NULL;

  /**
   * Data generated by the service encoded according to the Accept request header
   * @var mixed
   * @access protected
   */
  protected $encoded_data = NULL;

  /**
   * Whether to encode the data.
   * @var boolean
   * @access protected
   */
  protected $encode = true;

  /**
   * The mime type of the encoded data.  This will not be set until after get_data() is called.
   * @var string
   * @access private
   */
  private $mime_type = NULL;

  /**
   * The status object returned in response to the service request
   * @var service\status
   * @access protected
   */
  protected $status = NULL;

  /**
   * The path of the service
   * @var string
   * @access private
   */
  private $path = NULL;

  /**
   * The method used for the service
   * @var string
   * @access private
   */
  private $method = NULL;

  /**
   * The url query arguments.
   * @var array( array )
   * @access private
   */
  private $arguments = array();

  /**
   * The raw file posted by PATCH and POST requests
   * @var array( array )
   * @access private
   */
  private $file = NULL;

  /**
   * The PATCH/POST file as an object
   * @var array( array )
   * @access private
   */
  private $file_as_object = NULL;

  /**
   * The PATCH/POST file as an array
   * @var array( array )
   * @access private
   */
  private $file_as_array = NULL;

  /**
   * The writelog record associated with the service request (null for read-only services)
   * @var database\writelog
   * @access private
   */
  private $db_writelog = NULL;

  /**
   * A list of all collection names based on the service's path
   * @var array( string )
   * @access private
   */
  private $collection_name_list = NULL;

  /**
   * A list of all resource lookup values based on the service's path (may be an id or some other
   * set of key/value pair(s)
   * @var array( string )
   * @access private
   */
  private $resource_value_list = NULL;

  /**
   * A list of all modules
   * @var array
   * @access private
   */
  private $module_list = NULL;

  /**
   * A cache of generated resources
   * @var array( database\record )
   * @access private
   */
  private $resource_cache = array();

  /**
   * Whether to check if the user's access has permission to perform this service
   * @var boolean
   * @access private
   */
  private $validate_access = true;

  /**
   * Whether to check if the user's access has permission to perform this service
   * @var boolean
   * @access private
   */
  private $temporary_login = false;

  /**
   * A list of all valid methods (as keys) and whether they are write services (as value)
   * @var array( string => boolean )
   * @access private
   * @static
   */
  private static $method_list = array(
    'DELETE' => true,
    'GET' => false,
    'HEAD' => false,
    'PATCH' => true,
    'POST' => true );
}
