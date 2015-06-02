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
}
