<?php
/**
 * util.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access private
   */
  private final function __construct() {}

  /**
   * Returns the elapsed time in seconds since the script began.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return float
   * @static
   * @access public
   */
  public static function get_elapsed_time()
  {
    return microtime( true ) - $_SESSION['time']['script_start_time'];
  }

  /**
   * Returns the result of var_dump()
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * Returns a DateTimeZone object for the user's current site's timezone
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param boolean $server Whether to return the session's or server's timezone
   * @param database\site $db_site Override the session's site with another.
   * @return DateTimeZone
   * @access public
   */
  public static function get_timezone_object( $server = false, $db_site = NULL )
  {
    if( is_null( $db_site ) ) $db_site = lib::create( 'business\session' )->get_site();
    return new \DateTimeZone( $server || !$db_site ? 'UTC' : $db_site->timezone );
  }

  /**
   * Returns a DateTime object in the user's current site's timezone
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $datetime A date string in any valid PHP date time format.
   * @param boolean $server Whether to return the datetime in the session's or server's timezone
   * @return DateTime
   * @access public
   */
  public static function get_datetime_object( $datetime = NULL, $server = false )
  {
    return new \DateTime( $datetime, self::get_timezone_object( $server ) );
  }

  /**
   * Converts the server's date/time to a user's date/time
   * 
   * @author Patrick Emond <emondpd@mcamster.ca>
   * @param string $datetime A date string in any valid PHP date time format.
   * @param string $format The format to return the date/time in (default 'Y-m-d H:i:s')
   * @return string
   * @static
   * @access public
   */
  public static function from_server_datetime( $datetime, $format = 'Y-m-d H:i:s' )
  {
    if( is_null( $datetime ) || !is_string( $datetime ) ) return $datetime;

    $datetime_obj = self::get_datetime_object( $datetime, true ); // server's timezone
    $datetime_obj->setTimeZone( self::get_timezone_object() );
    return $datetime_obj->format( $format );
  }

  /**
   * Converts a user's date to server date.
   * 
   * @author Patrick Emond <emondpd@mcamster.ca>
   * @param string $datetime A date string in any valid PHP date time format.
   * @param string $format The format to return the date/time in (default 'Y-m-d H:i:s')
   * @return string
   * @static
   * @access public
   */
  public static function to_server_datetime( $datetime, $format = 'Y-m-d H:i:s' )
  {
    if( is_null( $datetime ) || !is_string( $datetime ) ) return $datetime;

    $datetime_obj = self::get_datetime_object( $datetime );
    $datetime_obj->setTimeZone( self::get_timezone_object( true ) );
    return $datetime_obj->format( $format );
  }

  /**
   * Returns the date and time as a user-friendly string.
   * 
   * @author Patrick Emond <emondpd@mcamster.ca>
   * @param string $datetime A date string in any valid PHP date time format.
   * @param boolean $include_seconds Whether to include the seconds in the output
   * @param string $invalid What to return if the input is invalid.
   * @return string
   * @static
   * @access public
   */
  public static function get_formatted_datetime(
    $datetime, $include_seconds = true, $invalid = 'unknown' )
  {
    if( is_null( $datetime ) || !is_string( $datetime ) ) return $invalid;

    $time_obj = self::get_datetime_object( $datetime );
    return $time_obj->format( 'Y-m-d '.( $include_seconds ? 'g:i:s A, T' : 'g:i A, T' ) );
  }

  /**
   * Returns the date as a user-friendly string.
   * 
   * @author Patrick Emond <emondpd@mcamster.ca>
   * @param string $date A date string in any valid PHP date time format.
   * @param string $invalid What to return if the input is invalid.
   * @return string
   * @static
   * @access public
   */
  public static function get_formatted_date( $date, $invalid = 'unknown' )
  {
    if( is_null( $date ) || !is_string( $date ) ) return $invalid;

    $datetime_obj = self::get_datetime_object( $date );
    return $datetime_obj->format( 'l, F jS, Y' );
  }

  /**
   * Returns the time as a user-friendly string.
   * 
   * @author Patrick Emond <emondpd@mcamster.ca>
   * @param string $time A time string in any valid PHP date time format.
   * @param boolean $include_seconds Whether to include the seconds in the output
   * @param string $invalid What to return if the input is invalid.
   * @return string
   * @static
   * @access public
   */
  public static function get_formatted_time( $time, $include_seconds = true, $invalid = 'unknown' )
  {
    if( is_null( $time ) || !is_string( $time ) ) return $invalid;

    $time_obj = self::get_datetime_object( $time );
    return $time_obj->format( $include_seconds ? 'g:i:s A, T' : 'g:i A, T' );
  }

  /**
   * Returns the interval between the date and "now"
   * 
   * @author Patrick Emond <emondpd@mcamster.ca>
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
   * Returns a fuzzy description of how long ago a certain date occured.
   * 
   * @author Patrick Emond <emondpd@mcamster.ca>
   * @param string $datetime A datetime string in any valid PHP date time format.
   * @return string
   * @static
   * @access public
   */
  public static function get_fuzzy_period_ago( $datetime )
  {
    if( is_null( $datetime ) || !is_string( $datetime ) ) return 'never';
    
    $interval = self::get_interval( $datetime );
    
    if( 0 != $interval->invert )
    {
      $result = 'in the future';
    }
    else if( 1 > $interval->i && 0 == $interval->h && 0 == $interval->days )
    {
      $result = 'seconds ago';
    }
    else if( 1 > $interval->h && 0 == $interval->days )
    {
      $result = 'minutes ago';
    }
    else if( 1 > $interval->d && 0 == $interval->days )
    {
      $result = 'hours ago';
    }
    else if( 1 == $interval->days )
    {
      $result = 'yesterday';
    }
    else if( 7 > $interval->days )
    {
      $datetime_obj = self::get_datetime_object( $datetime );
      $result = 'last '.$datetime_obj->format( 'l' );
    }
    else if( 1 > $interval->m && 0 == $interval->y )
    {
      $result = 'weeks ago';
    }
    else if( 1 > $interval->y )
    {
      $datetime_obj = self::get_datetime_object( $datetime );
      $result = 'last '.$datetime_obj->format( 'F' );
    }
    else
    {
      $result = 'years ago';
    }

    return $result;
  }
  
  /**
   * Attempts to convert a word into its plural form.
   * 
   * Warning: this method by no means returns the correct answer in every case.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $word
   * @return string
   * @static
   * @access public
   */
  public static function pluralize( $word )
  {
    // special cases
    if( 'access' == $word ) return $word;
    
    if( 'y' == substr( $word, -1 ) )
    { // likely, any word ending in 'y' has 'ies' at the end of the plural word
      return substr( $word, 0, -1 ).'ies';
    }
    
    if( 's' == substr( $word, -1 ) )
    { // likely, any word ending in an 's' has 'es' at the end of the plural word
      return $word.'es';
    }
    
    // if there is no rule for this word then we hope that adding an 's' at the end is sufficient
    return $word.'s';
  }

  /**
   * Encrypts a string (one-way) using the whirlpool algorithm
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $string
   * @return string
   * @access public
   * @static
   */
  public static function encrypt( $string )
  {
    return hash( 'whirlpool', 'password' );
  }

  /**
   * Validate's a user/password pair, returning true if the password is a match and false if not
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $username
   * @param string $password
   * @return boolean
   * @access public
   * @static
   */
  public static function validate_user( $username, $password )
  {
    $valid = false;
    $ldap_manager = lib::create( 'business\ldap_manager' );
    if( $ldap_manager->get_enabled() )
    { // ldap enabled, check the user/pass using the ldap manager
      $valid = $ldap_manager->validate_user( $username, $password );
    }
    else
    { // ldap not enabled, check the user/pass in the db
      $user_class_name = lib::get_class_name( 'database\user' );
      $db_user = $user_class_name::get_unique_record( 'name', $username );
      if( !is_null( $db_user ) )
        $valid = self::encrypt( $password ) === self::encrypt( $db_user->password );
    }
    
    return $valid;
  }

  /**
   * Converts an error number into an easier-to-read error code.
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * Sends an HTTP error status along with the specified data.
   * Warning, calling this method will cause the process to exit.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $data The data to send along with the error.
   * @static
   * @access public
   */
  public static function send_http_error( $data )
  {
    \HttpResponse::status( 400 );
    \HttpResponse::setContentType( 'application/json' ); 
    \HttpResponse::setData( $data );
    \HttpResponse::send();
  }
  
  /**
   * Get the foreground color of a jquery-ui theme.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $theme The name of a jquery theme.
   * @static
   * @access public
   */
  public static function get_foreground_color( $theme )
  {
    if( 'black-tie' == $theme ) $color = '#eeeeee';
    else if( 'blitzer' == $theme ) $color = '#ffffff';
    else if( 'cupertino' == $theme ) $color = '#222222';
    else if( 'dark-hive' == $theme ) $color = '#ffffff';
    else if( 'dot-luv' == $theme ) $color = '#f6f6f6';
    else if( 'eggplant' == $theme ) $color = '#ffffff';
    else if( 'excite-bike' == $theme ) $color = '#e69700';
    else if( 'flick' == $theme ) $color = '#444444';
    else if( 'hot-sneaks' == $theme ) $color = '#e1e463';
    else if( 'humanity' == $theme ) $color = '#ffffff';
    else if( 'le-frog' == $theme ) $color = '#ffffff';
    else if( 'mint-choc' == $theme ) $color = '#e3ddc9';
    else if( 'overcast' == $theme ) $color = '#444444';
    else if( 'pepper-grinder' == $theme ) $color = '#453821';
    else if( 'redmond' == $theme ) $color = '#ffffff';
    else if( 'smoothness' == $theme ) $color = '#222222';
    else if( 'south-street' == $theme ) $color = '#433f38';
    else if( 'start' == $theme ) $color = '#eaf5f7';
    else if( 'sunny' == $theme ) $color = '#ffffff';
    else if( 'swanky-purse' == $theme ) $color = '#eacd86';
    else if( 'trontastic' == $theme ) $color = '#222222';
    else if( 'ui-darkness' == $theme ) $color = '#ffffff';
    else if( 'ui-lightness' == $theme ) $color = '#ffffff';
    else if( 'vader' == $theme ) $color = '#ffffff';
    else $color = '#ffffff';

    return $color;
  }

  /**
   * Get the background color of a jquery-ui theme.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $theme The name of a jquery theme.
   * @static
   * @access public
   */
  public static function get_background_color( $theme )
  {
    if( 'black-tie' == $theme ) $background = '#333333';
    else if( 'blitzer' == $theme ) $background = '#cc0000';
    else if( 'cupertino' == $theme ) $background = '#deedf7';
    else if( 'dark-hive' == $theme ) $background = '#444444';
    else if( 'dot-luv' == $theme ) $background = '#0b3e6f';
    else if( 'eggplant' == $theme ) $background = '#30273a';
    else if( 'excite-bike' == $theme ) $background = '#f9f9f9';
    else if( 'flick' == $theme ) $background = '#dddddd';
    else if( 'hot-sneaks' == $theme ) $background = '#35414f';
    else if( 'humanity' == $theme ) $background = '#cb842e';
    else if( 'le-frog' == $theme ) $background = '#3a8104';
    else if( 'mint-choc' == $theme ) $background = '#453326';
    else if( 'overcast' == $theme ) $background = '#dddddd';
    else if( 'pepper-grinder' == $theme ) $background = '#ffffff';
    else if( 'redmond' == $theme ) $background = '#5c9ccc';
    else if( 'smoothness' == $theme ) $background = '#cccccc';
    else if( 'south-street' == $theme ) $background = '#ece8da';
    else if( 'start' == $theme ) $background = '#2191c0';
    else if( 'sunny' == $theme ) $background = '#817865';
    else if( 'swanky-purse' == $theme ) $background = '#261803';
    else if( 'trontastic' == $theme ) $background = '#9fda58';
    else if( 'ui-darkness' == $theme ) $background = '#333333';
    else if( 'ui-lightness' == $theme ) $background = '#f6a828';
    else if( 'vader' == $theme ) $background = '#888888';
    else $background = 'white';

    return $background;
  }

  /**
   * Encodes a string using a SHA1 hash.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * Encodes a string using a NTLM hash.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $string The string to encode
   * @return string
   * @static
   * @access public
   */
  public static function ntlm_hash( $string )
  {
    // Convert the password from UTF8 to UTF16 (little endian), encrypt with the MD4 hash and
    // make it uppercase (not necessary, but it's common to do so with NTLM hashes)
    return strtoupper( hash( 'md4', iconv( 'UTF-8', 'UTF-16LE', $string ) ) );
  }

  /**
   * Encodes a string using a LM hash.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $string The string to encode
   * @return string
   * @static
   * @access public
   */
  public static function lm_hash( $string )
  {
    $string = strtoupper( substr( $string, 0, 14 ) );

    $part_1 = self::des_encrypt( substr( $string, 0, 7 ) );
    $part_2 = self::des_encrypt( substr( $string, 7, 7 ) );

    return strtoupper( $part_1.$part_2 );
  }

  /**
   * Encrypts a string using the DES standard
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $string The string to encode
   * @return string
   * @static
   * @access public
   */
  public static function des_encrypt( $string )
  {
    $key = array();
    $tmp = array();
    $length = strlen( $string );

    for( $i = 0; $i < 7; ++$i ) $tmp[] = $i < $length ? ord( $string[$i] ) : 0;

    $key[] = $tmp[0] & 254;
    $key[] = ( $tmp[0] << 7 ) | ( $tmp[1] >> 1 );
    $key[] = ( $tmp[1] << 6 ) | ( $tmp[2] >> 2 );
    $key[] = ( $tmp[2] << 5 ) | ( $tmp[3] >> 3 );
    $key[] = ( $tmp[3] << 4 ) | ( $tmp[4] >> 4 );
    $key[] = ( $tmp[4] << 3 ) | ( $tmp[5] >> 5 );
    $key[] = ( $tmp[5] << 2 ) | ( $tmp[6] >> 6 );
    $key[] = $tmp[6] << 1;
   
    $key0 = '';
   
    foreach( $key as $k ) $key0 .= chr( $k );
    $crypt = mcrypt_encrypt(
      MCRYPT_DES, $key0, 'KGS!@#$%', MCRYPT_MODE_ECB,
      mcrypt_create_iv( mcrypt_get_iv_size( MCRYPT_DES, MCRYPT_MODE_ECB ), MCRYPT_RAND ) );

    return bin2hex( $crypt );
  }

  /**
   * Validates whether a date is in YYYY-MM-DD format.
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * Validates a north-american phone number in XXX-XXX-XXXX format.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $number
   * @param boolean $numeric_only Whether to ignore all non-numeric characters during check
   * @return boolean
   * @access public
   */
  public static function validate_phone_number( $number, $numeric_only = false )
  {
    $regex = $numeric_only
           ? '/[2-9](1[02-9]|[02-8]1|[02-8][02-9])[2-9](1[02-9]|[02-9]1|[02-9]{2})[0-9]{4}/'
           : '/[2-9](1[02-9]|[02-8]1|[02-8][02-9])-[2-9](1[02-9]|[02-9]1|[02-9]{2})-[0-9]{4}/';

    $check_number = $numeric_only
                  ? preg_replace( '/[^0-9]/', '', $number )
                  : $number;

    return preg_match( $regex, $check_number );
  }

  /**
   * Encodes any variable/object/array into a json string
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param mixed $arg
   * @return string
   * @static
   * @access public
   */
  public static function json_encode( $arg )
  {
    return json_encode( $arg );
  }

  /**
   * Decodes a json string and converts it into the corresponding variable/object/array
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $arg
   * @return mixed
   * @static
   * @access public
   */
  public static function json_decode( $arg )
  {
    return json_decode( self::utf8_encode( $arg ) );
  }

  /**
   * Encodes all strings in a variable, object or array to utf8 and removes all byte-order-marks.
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
}
?>
