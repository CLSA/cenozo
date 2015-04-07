<?php
/**
 * site.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * site: record
 */
class site extends base_access
{
  /**
   * Override select method to restrict sites to current application
   */
  public static function select( $select = NULL, $modifier = NULL, $return_alternate = '' )
  {
    if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'application_id', '=', lib::create( 'business\session' )->get_application()->id );

    return parent::select( $select, $modifier, $return_alternate );
  }

  /**
   * Gives a complete name for the site.
   * 
   * @author Patrick Emond <emondpd@mcamster.ca>
   * @access public
   */
  public function get_full_name()
  {
    return $this->name;
  }

  /**
   * Adds a list of users to the site with the given role.
   * 
   * @author Patrick Emond <emondpd@mcamster.ca>
   * @param int $user_id_list The users to add.
   * @param int $role_id The role to add them under.
   * @throws exeception\argument
   * @access public
   */
  public function add_access( $user_id_list, $role_id )
  {
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to add access to site with no id.' );
      return;
    }

    // make sure the user id list argument is a non-empty array of ids
    if( !is_array( $user_id_list ) || 0 == count( $user_id_list ) )
      throw lib::create( 'exception\argument', 'user_id_list', $user_id_list, __METHOD__ );
    
    // make sure the role id argument is valid
    if( 0 >= $role_id )
      throw lib::create( 'exception\argument', 'role_id', $role_id, __METHOD__ );

    $database_class_name = lib::get_class_name( 'database\database' );

    $values = '';
    $first = true;
    foreach( $user_id_list as $id )
    {
      if( !$first ) $values .= ', ';
      $values .= sprintf( '(NULL, %s, %s, %s)',
                       static::db()->format_string( $id ),
                       static::db()->format_string( $role_id ),
                       static::db()->format_string( $this->id ) );
      $first = false;
    }

    static::db()->execute(
      sprintf( 'INSERT IGNORE INTO access (create_timestamp, user_id, role_id, site_id) VALUES %s',
               $values ) );
  }

  /**
   * Removes a list of users to the site who have the given role.
   * 
   * @author Patrick Emond <emondpd@mcamster.ca>
   * @param int $access_id The access record to remove.
   * @access public
   */
  public function remove_access( $access_id )
  {
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to remove access from site with no id.' );
      return;
    }

    $db_access = lib::create( 'database\access', $access_id );
    $db_access->delete();
  }

  /**
   * Converts a datetime string to the site's local time.
   * 
   * @author Patrick Emond <emondpd@mcamster.ca>
   * @param string $datetime A date string in any valid PHP date time format
   * @param string $format The format to return the date/time in (default 'Y-m-d H:i:s')
   * @param boolean $server Whether to convert to the server's instead of the user's timezone
   * @return string
   * @access public
   */
  public function to_site_datetime( $datetime, $format = 'Y-m-d H:i:s', $server = false )
  {
    if( is_null( $datetime ) || !is_string( $datetime ) ) return $datetime;

    $util_class_name = lib::get_class_name( 'util' );
    $datetime_obj = new \DateTime( $datetime, new \DateTimeZone( $this->timezone ) );
    $datetime_obj->setTimeZone( $util_class_name::get_timezone_object( $server ) );
    return $datetime_obj->format( $format );
  }

  /**
   * Determines the difference in hours between the user's timezone and the site's timezone
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return float (NULL if it is not possible to get the time difference)
   * @access public
   */
  public function get_time_diff()
  {
    $util_class_name = lib::get_class_name( 'util' );

    // create a datetime object using this site's timezone
    $site_datetime_obj =
      new \DateTime( NULL, $util_class_name::get_timezone_object( false, $this ) );

    // get the user's and site's timezone differential from UTC
    $user_offset = $util_class_name::get_datetime_object()->getOffset() / 3600;
    $site_offset = $site_datetime_obj->getOffset() / 3600;

    return $site_offset - $user_offset;
  }
}
