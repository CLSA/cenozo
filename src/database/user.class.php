<?php
/**
 * user.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * user: record
 */
class user extends record
{
  /**
   * Override parent method if identifier is 0 (get record from session)
   */
  public static function get_record_from_identifier( $identifier )
  {
    // session objects can be loaded by using the identifier 0
    return 0 === $identifier || '0' === $identifier ?
      lib::create( 'business\session' )->get_user() :
      parent::get_record_from_identifier( $identifier );
  }

  /**
   * Adds a list of sites to the user with the given role.
   * 
   * @author Patrick Emond <emondpd@mcamster.ca>
   * @param int $site_id_list The sites to add.
   * @param int $role_id The role to add them under.
   * @throws exeception\argument
   * @access public
   */
  public function add_access( $site_id_list, $role_id )
  {
    // make sure the site id list argument is a non-empty array of ids
    if( !is_array( $site_id_list ) || 0 == count( $site_id_list ) )
      throw lib::create( 'exception\argument', 'site_id_list', $site_id_list, __METHOD__ );

    // make sure the role id argument is valid
    if( 0 >= $role_id )
      throw lib::create( 'exception\argument', 'role_id', $role_id, __METHOD__ );

    $value_list = array();
    foreach( $site_id_list as $id )
      $value_list[] = sprintf( '(NULL, %s, %s, %s)',
                               static::db()->format_string( $id ),
                               static::db()->format_string( $role_id ),
                               static::db()->format_string( $this->id ) );

    static::db()->execute(
      sprintf( 'INSERT IGNORE INTO access (create_timestamp, site_id, role_id, user_id)'."\n".
               'VALUES %s',
               implode( ",\n       ", $values ) ) );
  }

  /**
   * Removes a list of sites to the user who have the given role.
   * 
   * @author Patrick Emond <emondpd@mcamster.ca>
   * @param int $access_id The access record to remove.
   * @access public
   */
  public function remove_access( $access_id )
  {
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to remove access from user with no primary key.' );
      return;
    }

    $db_access = lib::create( 'database\access', $access_id );
    $db_access->delete();
  }

  /**
   * Determines whether this user has an open assignment
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access public
   */
  public function has_open_assignment()
  {
    $setting_manager = lib::create( 'business\setting_manager' );
    if( !$setting_manager->get_setting( 'module', 'interview' ) )
    {
      log::warning( 'Called has_open_assignment but interview module is not installed.' );
      return false;
    }
    else if( is_null( $this->id ) )
    {
      log::warning( 'Tried to determine if user with no primary key has an open assignment.' );
      return false;
    }

    $assignment_mod = lib::create( 'database\modifier' );
    $assignment_mod->where( 'end_datetime', '=', NULL );
    return 0 < $this->get_assignment_count( $assignment_mod );
  }

  /**
   * Returns this user's open assignment, or NULL if there is no open assignment
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return database\assignment
   * @access public
   */
  public function get_open_assignment()
  {
    $setting_manager = lib::create( 'business\setting_manager' );
    if( !$setting_manager->get_setting( 'module', 'interview' ) )
    {
      log::warning( 'Called get_open_assignment but interview module is not installed.' );
      return NULL;
    }
    else if( is_null( $this->id ) )
    {
      log::warning( 'Tried to get open assignment from user with no primary key.' );
      return NULL;
    }

    $assignment_mod = lib::create( 'database\modifier' );
    $assignment_mod->where( 'end_datetime', '=', NULL );
    $assignment_mod->order_desc( 'start_datetime' );
    $assignment_list = $this->get_assignment_object_list( $assignment_mod );
    if( 1 < count( $assignment_list ) )
      log::warning( sprintf( 'User %d (%s) has more than one open assignment!', $this->id, $this->name ) );
    return 0 < count( $assignment_list ) ? current( $assignment_list ) : NULL;
  }

  /**
   * Determines whether this user has an open phone call
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access public
   */
  public function has_open_phone_call()
  {
    $setting_manager = lib::create( 'business\setting_manager' );
    if( !$setting_manager->get_setting( 'module', 'interview' ) )
    {
      log::warning( 'Called has_open_phone_call but interview module is not installed.' );
      return false;
    }
    else if( is_null( $this->id ) )
    {
      log::warning( 'Tried to determine if user with no primary key has an open phone call.' );
      return NULL;
    }

    $assignment_mod = lib::create( 'database\modifier' );
    $assignment_mod->join( 'phone_call', 'assignment.id', 'phone_call.assignment_id' );
    $assignment_mod->where( 'phone_call.end_datetime', '=', NULL );
    return 0 < $this->get_assignment_count( $assignment_mod );
  }

  /**
   * Returns this user's open phone call, or NULL if there is no open phone call
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return database\phone_call
   * @access public
   */
  public function get_open_phone_call()
  {
    $setting_manager = lib::create( 'business\setting_manager' );
    if( !$setting_manager->get_setting( 'module', 'interview' ) )
    {
      log::warning( 'Called get_open_phone_call but interview module is not installed.' );
      return NULL;
    }
    else if( is_null( $this->id ) )
    {
      log::warning( 'Tried to get open phone_call from user with no primary key.' );
      return NULL;
    }

    $phone_call_class_name = lib::get_class_name( 'database\phone_call' );
    $phone_call_mod = lib::create( 'database\modifier' );
    $phone_call_mod->join( 'assignment', 'phone_call.assignment_id', 'assignment.id' );
    $phone_call_mod->where( 'assignment.user_id', '=', $this->id );
    $phone_call_mod->where( 'phone_call.end_datetime', '=', NULL );
    $phone_call_mod->order_desc( 'phone_call.start_datetime' );
    $phone_call_list = $phone_call_class_name::select_objects( $phone_call_mod );
    if( 1 < count( $phone_call_list ) )
      log::warning( sprintf( 'User %d (%s) has more than one open phone call!', $this->id, $this->name ) );
    return 0 < count( $phone_call_list ) ? current( $phone_call_list ) : NULL;
  }
}
