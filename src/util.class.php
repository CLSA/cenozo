<?php
/**
 * util.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo;
use cenozo\lib, cenozo\log;

/**
 * util: utility class of static methods
 *
 * This class is where all utility functions belong.  The class cannot be instantiated, but it
 * may be extended.  All methods within the class must be static.
 * NOTE: only functions which do not logically belong in any class should be included here.
 */
class util
{
  /**
   * Constructor (or not)
   * 
   * This method is kept private so that no one ever tries to instantiate it.
   * @access private
   */
  private final function __construct() {}

  /**
   * Returns the elapsed time in seconds since the script began.
   * 
   * @return float
   * @static
   * @access public
   */
  public static function get_elapsed_time()
  {
    return microtime( true ) - START_TIME;
  }

  /**
   * Returns the result of var_dump()
   * 
   * @param mixed $data The data to dump.
   * @static
   * @access public
   */
  public static function var_dump( $data )
  {
    // get the var_dump string by buffering the output
    ob_start();
    var_dump( $data );
    return ob_get_clean();
  }

  /**
   * An html-enhanced var_dump
   * 
   * @param mixed $data The data to display.
   * @static
   * @access public
   */
  public static function var_dump_html( $data )
  {
    // make strings magenta
    $output = preg_replace(
      '/("[^"]*")/', '<font color="magenta">${1}</font>', self::var_dump( $data ) );

    // make types yellow and type braces red
    $output = preg_replace(
      '/\n( *)(bool|int|float|string|array|object)\(([^)]*)\)/',
      "\n".'${1}<font color="yellow">${2}</font>'.
      '<font color="red">(</font>'.
      '<font color="white"> ${3} </font>'.
      '<font color="red">)</font>',
      "\n".$output );

    // replace => with html arrows
    $output = str_replace( '=>', ' &#8658;', $output );

    // output as a pre
    echo '<pre style="font-weight: bold; color: #B0B0B0; background: black">'.$output.'</pre>';
  }

  /**
   * Execute a command with a time limit
   * 
   * @see http://snippet.espend.de/php/execute-command-timeout-limit-78.html
   * @param string $command The shell command you wish to execute
   * @param integer $timeout
   * @return associative array Several details of the command including "output" and "exitcode"
   * @throws exception\runtime
   */
  public static function exec_timeout( $command, $timeout = 10 )
  {
    // redirect the error output so we get it as output
    $command .= ' 2>&1';

    $descriptorspec = array( array( 'pipe', 'r' ), array( 'pipe', 'w' ), array( 'pipe', 'w' ) );
    $pipes = array();

    $timeout += time();
    $process = proc_open( $command, $descriptorspec, $pipes );
    if( !is_resource( $process ) )
      throw lib::create( 'exception\runtime', sprintf( 'proc_open failed on: "%s"', $command ), __METHOD__ );

    $output = '';
    do
    {
      $timeleft = $timeout - time();
      $read = array( $pipes[1] );
      $write = array();
      $exeptions= array();
      stream_select( $read, $write, $exeptions, $timeleft );

      if( !empty( $read ) ) $output .= fread( $pipes[1], 8192 );
    } while( !feof( $pipes[1] ) && $timeleft > 0 );

    if( $timeleft <= 0 )
    {
      proc_terminate( $process );
      throw lib::create( 'exception\runtime', sprintf( 'command timeout on: "%s"', $command ), __METHOD__ );
    }

    $result = proc_get_status( $process );
    $result['output'] = $output;
    return $result;
  }

  /**
   * Returns request header information
   */
  public static function get_header( $name )
  {
    $apache_headers = apache_request_headers();
    if( false === $apache_headers )
      throw lib::create( 'exception\runtime', 'Unable to decode Apache request headers', __METHOD__ );

    // Depending on the version of PHP the case of header names may vary, so create an array with lowercase keys
    $headers = [];
    foreach( $apache_headers as $key => $value ) $headers[strtolower($key)] = $value;

    $name = strtolower( $name );
    return array_key_exists( $name, $headers ) ? $headers[$name] : NULL;
  }

  /**
   * Test whether a variable's string value matches its int value
   * 
   * This function converts the variable to an int then into string and tests whether this is the
   * exact same as only converting the variable to a string.
   * Example: values "1", 123, -15 and "-141" will all return true
   *          values "00", 1.1, "one", "11one" and NULL will all return false
   * @param mixed $var The variable to test
   * @return boolean
   * @static
   * @access public
   */
  public static function string_matches_int( $var )
  {
    return (string)(int)$var === (string)$var;
  }

  /**
   * Test whether a variable's string value matches its float value
   * 
   * This function converts the variable to an float then into string and tests whether this is the
   * exact same as only converting the variable to a string.
   * Example: values "1", 123, -15, "-141", 1.1 and "1.154" will all return true
   *          values "00", "one", "11one" and NULL will all return false
   * @param mixed $var The variable to test
   * @return boolean
   * @static
   * @access public
   */
  public static function string_matches_float( $var )
  {
    return (string)(float)$var === (string)$var;
  }

  /**
   * Returns a timezone string given an offset and whether to observe daylight savings
   * 
   * @param integer $offset
   * @param boolean $daylight_savings
   * @return string
   * @access public
   * @static
   */
  public static function get_timezone_name( $offset, $daylight_savings )
  {
    if( $daylight_savings )
    {
      if( -8 == $offset ) return 'Canada/Pacific';
      if( -7 == $offset ) return 'Canada/Mountain';
      if( -6 == $offset ) return 'Canada/Central';
      if( -5 == $offset ) return 'Canada/Eastern';
      if( -4 == $offset ) return 'Canada/Atlantic';
      if( -3.5 == $offset ) return 'Canada/Newfoundland';
    }

    // north american timezone not found, return the Etc timezone instead
    $offset = $offset;
    if( $daylight_savings && 1 == date( 'I' ) ) $offset++;
    $offset = -$offset; // Etc has +/- reversed, 'cause that's not confusing...
    if( 0 <= $offset ) $offset = '+'.abs( $offset ); // because we can have -0 for some reason...
    return 'Etc/GMT'.$offset;
  }

  /**
   * Returns a site's timezone offset for a particular datetime
   * 
   * @param string|DateTime The default is the current datetime
   * @param database\site $db_site The default is the user's current site
   * @return float
   * @access public
   */
  public static function get_timezone_offset( $datetime = NULL, $db_site = NULL )
  {
    $datetime = static::get_datetime_object( $datetime );
    if( is_null( $db_site ) ) $db_site = lib::create( 'business\session' )->get_site();
    return $db_site->get_timezone_object()->getOffset( $datetime ) / 3600;
  }

  /**
   * Returns a DateTime object
   * 
   * @param string $datetime A date string in any valid PHP date time format.
   * @param string|DateTimeZone $timezone Used to define new datetime object timezone (default is UTC)
   * @return DateTime
   * @access public
   */
  public static function get_datetime_object( $datetime = NULL, $timezone = NULL )
  {
    if( is_object( $datetime ) )
    {
      if( 'DateTime' != get_class( $datetime ) )
        throw lib::create( 'exception\argument', 'datetime', $datetime, __METHOD__ );
      return clone $datetime;
    }
    else if( is_string( $datetime ) || is_null( $datetime ) )
    {
      $datetime = is_null( $datetime ) || 1 == preg_match( '/null|current_timestamp(\(\))?/i', $datetime )
                ? 'now'
                : str_replace( "'", '', $datetime );
      $timezone_obj = NULL;
      if( is_object( $timezone ) )
      {
        if( 'DateTimeZone' != get_class( $timezone ) )
          throw lib::create( 'exception\argument', 'timezone', $timezone, __METHOD__ );
        $timezone_obj = $timezone;
      }
      else
      {
        $timezone_obj = new \DateTimeZone( is_null( $timezone ) ? 'UTC' : $timezone );
      }
      $datetime_obj = new \DateTime( $datetime, $timezone_obj );
      $datetime_obj->setTimezone( $timezone_obj );
      return $datetime_obj;
    }

    // no way to convert to a datetime object
    throw lib::create( 'exception\argument', 'datetime', $datetime, __METHOD__ );
  }

  /**
   * Returns the interval between the date and "now"
   * 
   * @param string $date A date string in any valid PHP date time format.
   * @param string $date2 A second string to compare to instead of "now"
   * @return \DateInterval
   * @static
   * @access public
   */
  public static function get_interval( $date, $date2 = NULL )
  {
    // we need to convert to server time since we will compare to the server's "now" time
    $datetime_obj = is_object( $date ) ? $date : self::get_datetime_object( $date );
    $date2_obj = is_object( $date2 ) ? $date2 : self::get_datetime_object( $date2 );
    return $datetime_obj->diff( $date2_obj );
  }

  /**
   * Validate's a user/password pair, returning true if the password is a match and false if not
   * 
   * @param string $username
   * @param string $password
   * @param boolean $count_failure Whether or not to increment the user's login failures on an invalid password
   * @return boolean
   * @access public
   * @static
   */
  public static function validate_user( $username, $password, $count_failure = false )
  {
    $user_class_name = lib::get_class_name( 'database\user' );
    $setting_manager = lib::create( 'business\setting_manager' );
    $dogwood_manager = lib::create( 'business\dogwood_manager' );
    $db_user = $user_class_name::get_unique_record( 'name', $username );

    $valid = NULL;
    if( $dogwood_manager->get_enabled() )
    {
      try
      {
        $valid = $dogwood_manager->validate( $username, $password );
      }
      catch( \cenozo\exception\runtime $e )
      {
        log::warning(
          sprintf(
            "Unable to reach dogwood service, failing back to local user records.\n%s",
            $e->get_raw_message()
          )
        );
      }
    }

    if( is_null( $valid ) )
    { // either dogwood is not enabled or it failed, check the user/pass in the database
      if( !is_null( $db_user ) )
      {
        $valid = 'whirlpool' == $db_user->password_type ?
          hash( 'whirlpool', $password ) === $db_user->password :
          password_verify( $password, $db_user->password );
      }
    }

    if( !is_null( $valid ) && !is_null( $db_user ) && $count_failure )
    {
      // if valid then store the password hash in the database and reset the user's login failure count
      if( $valid )
      {
        // only update if not yet stored as bcrypt hash
        if( 'bcrypt' != $db_user->password_type ) $db_user->password = $password; // hashed in database\user

        $db_user->login_failures = 0;
      }
      else // if invalid then increment the user's login failure count and deactivate if necessary
      {
        $db_failed_login = lib::create( 'database\failed_login' );
        $db_failed_login->user_id = $db_user->id;
        $db_failed_login->application_id = lib::create( 'business\session' )->get_application()->id;
        $db_failed_login->address = $_SERVER['REMOTE_ADDR'];
        $db_failed_login->datetime = static::get_datetime_object();
        $db_failed_login->save();

        $db_user->login_failures++;
        if( $db_user->active )
        {
          $login_failure_limit = $setting_manager->get_setting( 'general', 'login_failure_limit' );
          if( $login_failure_limit && $login_failure_limit <= $db_user->login_failures )
          {
            log::info( sprintf(
              'Deactivating user "%s" since they have passed the login failure limit of %d.',
              $db_user->name,
              $login_failure_limit
            ) );
            $db_user->active = false;
          }
        }
      }

      $db_user->save();
    }

    return is_null( $valid ) ? false : $valid;
  }

  /**
   * Converts an error number into an easier-to-read error code.
   * @param int $number The error number.
   * @return string
   * @static
   * @access public
   */
  public static function convert_number_to_code( $number )
  {
    return preg_replace( '/^([0-9]+)([0-9]{3})/', '$1.$2', $number );
  }

  /**
   * Encodes a string using a SHA1 hash.
   * 
   * @param string $string The string to encode
   * @return string
   * @static
   * @access public
   */
  public static function sha1_hash( $string )
  {
    return '{SHA}'.base64_encode( pack( 'H*', sha1( $string ) ) );
  }

  /**
   * Encodes a string using a MD5 hash.
   * 
   * @param string $string The string to encode
   * @return string
   * @static
   * @access public
   */
  public static function md5_hash( $string )
  {
    return '{MD5}'.base64_encode( pack( 'H*', md5( $string ) ) );
  }

  /**
   * Validates whether a date is in YYYY-MM-DD format.
   * @param string $date
   * @return boolean
   * @static
   * @access public
   */
  public static function validate_date( $date )
  {
    return preg_match(
      '/^(19|20)\d\d-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/',
      $date );
  }

  /**
   * Validates whether a datetime is in YYYY-MM-DD hh:mm[:ss] format.
   * @param string $date
   * @return boolean
   * @static
   * @access public
   */
  public static function validate_datetime( $datetime )
  {
    return preg_match(
      '/^(19|20)\d\d-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01]) ([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/',
      $datetime );
  }

  /**
   * Converts any string into a north-american phone number: XXX-XXX-XXXX format
   * @param string $number
   * @return string
   */
  public static function convert_north_american_phone_number( $number )
  {
    $number = preg_replace( '/[^0-9]/', '', $number );
    $number = sprintf(
      '%s-%s-%s',
      substr( $number, 0, 3 ),
      substr( $number, 3, 3 ),
      substr( $number, 6 )
    );
    return $number;
  }

  /**
   * Validates a north-american phone number in XXX-XXX-XXXX format.
   * @param string $number
   * @param boolean $numeric_only Whether to ignore all non-numeric characters during check
   * @return boolean
   * @static
   * @access public
   */
  public static function validate_north_american_phone_number( $number, $numeric_only = false )
  {
    $regex = $numeric_only
           ? '/^[2-9](1[02-9]|[02-8]1|[02-8][02-9])[2-9](1[02-9]|[02-9]1|[02-9]{2})[0-9]{4}$/'
           : '/^[2-9](1[02-9]|[02-8]1|[02-8][02-9])-[2-9](1[02-9]|[02-9]1|[02-9]{2})-[0-9]{4}$/';

    $check_number = $numeric_only
                  ? preg_replace( '/[^0-9]/', '', $number )
                  : $number;

    return preg_match( $regex, $check_number );
  }

  /**
   * Validates an email address in account@domain.name format.
   * 
   * Note, this function does not thoroughly check email addresses.  It only checks to make
   * sure that there are no spaces or commas, there is exactly one @ symbol and at least one
   * period (.) which comes after the @ symbol.
   * @param string $email
   * @return boolean
   * @static
   * @access public
   */
  public static function validate_email( $email )
  {
    // remove spaces around the address
    $email = trim( $email );

    // check for spaces
    if( preg_match( '/[ ,]/', $email ) ) return false;

    // explode on the @ symbol
    $parts = explode( '@', $email );
    if( 2 != count( $parts ) || 0 == strlen( $parts[0] ) || 0 == strlen( $parts[1] ) ) return false;

    // explode the host part by the . symbol
    $parts = explode( '.', $parts[1] );
    if( 2 > count( $parts ) ) return false;

    // make sure each part isn't blank
    foreach( $parts as $part ) if( 0 == strlen( $part ) ) return false;

    return true;
  }

  /**
   * Converts a string to the correct character set.
   * 
   * The application is current set to use Windows-1252//TRANSLIT.  This coincides with the database charset utf8mb4
   * @param string $string
   * @return string
   * @access public
   */
  public static function convert_charset( $string )
  {
    return iconv( 'UTF-8', 'Windows-1252//TRANSLIT', $string );
  }

  /**
   * Fully encode a URL string
   * @param string $input
   * @static
   * @return string
   * @access public
   */
  public static function full_urlencode( $input )
  {
    $output = '';

    for( $index = 0; $index < strlen( $input ); $index++ )
    {
      $hex = dechex( ord( $input[$index] ) );
      $output = '' == $hex
              ? $output.urlencode($input[$index])
              : $output .'%'.( ( strlen( $hex ) == 1 ) ? ( '0'.strtoupper( $hex ) ) : ( strtoupper( $hex ) ) );
    }
    $output = str_replace( '+', '%20', $output );
    $output = str_replace( '_', '%5F', $output );
    $output = str_replace( '.', '%2E', $output );
    $output = str_replace( '-', '%2D', $output );

    return $output;
  }

  /**
   * Encodes any variable/object/array into a json string
   * @param mixed $arg
   * @params bitmask $options See PHP's json_encode docs for more details
   * @return string
   * @static
   * @access public
   */
  public static function json_encode( $arg, $options = 0 )
  {
    return json_encode( self::utf8_encode( $arg ), $options );
  }

  /**
   * Decodes a json string and converts it into the corresponding variable/object/array
   * 
   * Note that the associative property controls how the parent PHP json_decode function behaves. From the docs:
   * When true, JSON objects will be returned as associative arrays; when false, JSON objects will be returned
   * as objects. When null, JSON objects will be returned as associative arrays or objects depending on whether
   * JSON_OBJECT_AS_ARRAY is set in the flags.
   * @param string $arg
   * @param boolean $associative
   * @return mixed
   * @static
   * @access public
   */
  public static function json_decode( $arg, $associative = NULL )
  {
    return json_decode( self::utf8_encode( $arg ), $associative );
  }

  /**
   * Encodes all strings in a variable, object or array to utf8 and removes all byte-order-marks.
   * @param mixed $arg
   * @return mixed
   * @static
   * @access public
   */
  public static function utf8_encode( $arg )
  {
    // make a copy (clone if this is an object
    $encoded_arg = is_object( $arg ) ? clone $arg : $arg;

    if( is_object( $arg ) )
      foreach( get_object_vars( $arg ) as $key => $val )
        $encoded_arg->$key = self::utf8_encode( $val );
    else if( is_array( $arg ) )
      foreach( $arg as $key => $val )
        $encoded_arg[$key] = self::utf8_encode( $val );
    else if( is_string( $arg ) )
    {
      // convert to utf8 and remove byte-order-marks (BOM) if present
      $encoded_arg = mb_convert_encoding( $arg, 'UTF-8', 'ASCII,UTF-8,ISO-8859-1' );
      if( pack( 'CCC', 0xEF, 0xBB, 0xBF ) == substr( $encoded_arg, 0, 3 ) )
        $encoded_arg = substr( $encoded_arg, 3 );
    }
    else $encoded_arg = $arg;

    return $encoded_arg;
  }

  /**
   * Converts raw data from the database into CSV format
   * 
   * This method will alter the data including:
   *   convert datetime formats
   *   converts timezones
   * @param array $data Associative array where keys are column names and values are column values
   * @param database\user $db_user Which user to use when determining datetime formats
   * @param boolean $transpose Whether to transpose the data
   * @return string (with newlines)
   * @static
   * @access public
   */
  public static function get_data_as_csv( $data, $db_user = NULL, $transpose = false )
  {
    $session = lib::create( 'business\session' );
    if( is_null( $db_user ) ) $db_user = $session->get_user();
    $now = static::get_datetime_object();
    if( !is_null( $db_user ) ) $now->setTimezone( $db_user->get_timezone_object() );
    $tz = $now->format( 'T' );
    $time_format = is_null( $db_user ) || !$db_user->use_12hour_clock ? 'H:i:s' : 'h:i:s a';

    $csv_array = array();

    if( is_string( $data ) )
    {
      $csv_array[0] = array( $data );
    }
    else if( is_array( $data ) )
    {
      foreach( $data as $key => $value )
      {
        if( is_array( $value ) )
        {
          // put in the header row
          if( 0 == count( $csv_array ) )
          {
            $row_data = array();
            foreach( $value as $sub_key => $sub_value )
              if( !in_array( $sub_key, array( 'update_timestamp', 'create_timestamp' ) ) )
                $row_data[] = $sub_key;
            $csv_array[] = $row_data;
          }

          $row_data = array();
          foreach( $value as $sub_key => $sub_value )
          {
            if( !in_array( $sub_key, array( 'update_timestamp', 'create_timestamp' ) ) )
            {
              // convert timezones
              if( preg_match( '/T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]\+00:00/', $sub_value ) )
              {
                $datetime_obj = static::get_datetime_object( $sub_value );
                $datetime_obj->setTimezone( $db_user->get_timezone_object() );
                $sub_value = $datetime_obj->format( 'Y-m-d '.$time_format );

                // and add the timezone to the header
                $col = count( $row_data );
                $header = $csv_array[0][$col];
                $suffix = sprintf( ' (%s)', $tz );
                if( false === strpos( $header, $suffix ) ) $csv_array[0][$col] = $header.$suffix;
              }
              else if( is_bool( $sub_value ) ) $sub_value = $sub_value ? 'yes' : 'no';

              $row_data[] = $sub_value;
            }
          }
          $csv_array[] = $row_data;
        }
        else
        {
          if( !in_array( $key, array( 'update_timestamp', 'create_timestamp' ) ) )
          {
            // convert timezones
            if( preg_match( '/T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]\+00:00/', $value ) )
            {
              $datetime_obj = static::get_datetime_object( $value );
              $datetime_obj->setTimezone( $db_user->get_timezone_object() );
              $value = $datetime_obj->format( 'Y-m-d '.$time_format.' T' );
            }
            else if( is_bool( $value ) ) $value = $value ? 'yes' : 'no';

            $csv_array[] = array( $key, $value );
          }
        }
      }
    }

    if( $transpose )
    {
      function transpose( $array ) { return array_map( null, ...$array ); }
      $csv_array = transpose( $csv_array );
    }

    $encoded_data = '';
    foreach( $csv_array as $row )
    {
      $row = array_map( function( $value ) { return sprintf( '"%s"', str_replace( '"', '""', $value ) ); }, $row );
      $encoded_data .= implode( ',', $row )."\n";
    }

    return static::convert_charset( $encoded_data );
  }

  /**
   * Converts a date to a different language
   * 
   * @param string $date_string The date string to convert
   * @param database\language $db_language The language to change it to
   * @return string
   * @static
   * @access public
   */
  public static function convert_datetime_language( $date_string, $db_language )
  {
    if( 'fr' == $db_language->code )
    {
      $date_string = str_replace( ' at ', ' à ', $date_string );

      $date_string = str_replace( 'Monday', 'lundi', $date_string );
      $date_string = str_replace( 'Tuesday', 'mardi', $date_string );
      $date_string = str_replace( 'Wednesday', 'mercredi', $date_string );
      $date_string = str_replace( 'Thursday', 'jeudi', $date_string );
      $date_string = str_replace( 'Friday', 'vendredi', $date_string );
      $date_string = str_replace( 'Saturday', 'samedi', $date_string );
      $date_string = str_replace( 'Sunday', 'dimanche', $date_string );

      $date_string = str_replace( 'January', 'janvier', $date_string );
      $date_string = str_replace( 'February', 'février', $date_string );
      $date_string = str_replace( 'March', 'mars', $date_string );
      $date_string = str_replace( 'April', 'avril', $date_string );
      $date_string = str_replace( 'May', 'mai', $date_string );
      $date_string = str_replace( 'June', 'juin', $date_string );
      $date_string = str_replace( 'July', 'juillet', $date_string );
      $date_string = str_replace( 'August', 'août', $date_string );
      $date_string = str_replace( 'September', 'septembre', $date_string );
      $date_string = str_replace( 'October', 'octobre', $date_string );
      $date_string = str_replace( 'November', 'novembre', $date_string );
      $date_string = str_replace( 'December', 'décembre', $date_string );

      $date_string = str_replace( 'PDT', 'HAP', $date_string );
      $date_string = str_replace( 'MDT', 'HAR', $date_string );
      $date_string = str_replace( 'CDT', 'HAC', $date_string );
      $date_string = str_replace( 'EDT', 'HAE', $date_string );
      $date_string = str_replace( 'ADT', 'HAA', $date_string );
      $date_string = str_replace( 'NDT', 'HAT', $date_string );
      $date_string = str_replace( 'PST', 'HNP', $date_string );
      $date_string = str_replace( 'MST', 'HNR', $date_string );
      $date_string = str_replace( 'CST', 'HNC', $date_string );
      $date_string = str_replace( 'EST', 'HNE', $date_string );
      $date_string = str_replace( 'AST', 'HNA', $date_string );
      $date_string = str_replace( 'NST', 'HNT', $date_string );
    }

    return $date_string;
  }

  /** 
   * Helper function to solve issue with using scandir on NFS drives
   * 
   * Note that using scandir on an NFS drive sometimes doesn't show new files.  This is described here:
   * https://unix.stackexchange.com/questions/154938/linux-does-not-see-a-file-until-i-ls-on-that-directory
   * The solution is to run ls on the folder before calling scandir.
   * NOTE: This command is LINUX only and will not work under WINDOWS
   * @param string $directory
   * @param int $sorting_order
   * @param ?resource $context
   * @return array|false
   */
  public static function scandir( $directory, $sorting_order = SCANDIR_SORT_ASCENDING, $context = null )
  {
    exec( sprintf( 'ls %s', $directory ) );
    return is_null( $context ) ?
      scandir( $directory, $sorting_order ) :
      scandir( $directory, $sorting_order, $context );
  }

  /**
   * Used to translate file sizes into a human readable description
   * 
   * @param integer $size
   * @param string $unit Force a particular unit type (automatic if left blank)
   * @return string
   */
  public static function human_file_size( $size, $unit = "" )
  {
    if( ( !$unit && $size >= 1<<50 ) || $unit == "PB" ) return number_format( $size / ( 1<<50 ), 2 )."PB";
    if( ( !$unit && $size >= 1<<40 ) || $unit == "TB" ) return number_format( $size / ( 1<<40 ), 2 )."TB";
    if( ( !$unit && $size >= 1<<30 ) || $unit == "GB" ) return number_format( $size / ( 1<<30 ), 2 )."GB";
    if( ( !$unit && $size >= 1<<20 ) || $unit == "MB" ) return number_format( $size / ( 1<<20 ), 2 )."MB";
    if( ( !$unit && $size >= 1<<10 ) || $unit == "KB" ) return number_format( $size / ( 1<<10 ), 2 )."KB";
    return number_format( $size )." bytes";
  }
}
