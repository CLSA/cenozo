<?php
/**
 * access.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * access: record
 */
class access extends record
{
  /**
   * Returns whether or not the access exists.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param user $db_user
   * @param site $db_site
   * @param role $db_role
   * @return boolean
   * @static
   * @access public
   */
  public static function exists( $db_user, $db_site, $db_role )
  {
    // validate arguments
    if( !is_object( $db_user ) ||
        !is_a( $db_user, lib::get_class_name( 'database\user' ) ) )
    {
      throw lib::create( 'exception\argument', 'user', $db_user, __METHOD__ );
    }
    else if( !is_object( $db_role ) ||
             !is_a( $db_role, lib::get_class_name( 'database\role' ) ) )
    {
      throw lib::create( 'exception\argument', 'role', $db_role, __METHOD__ );
    }
    else if( !is_object( $db_site ) ||
             !is_a( $db_site, lib::get_class_name( 'database\site' ) ) )
    {
      throw lib::create( 'exception\argument', 'site', $db_site, __METHOD__ );
    }

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'user_id', '=', $db_user->id );
    $modifier->where( 'role_id', '=', $db_role->id );
    $modifier->where( 'site_id', '=', $db_site->id );

    $id = static::db()->get_one(
      sprintf( 'SELECT id FROM access %s',
               $modifier->get_sql() ) );

    return !is_null( $id );
  }
  
  /**
   * Override parent save method by making sure that higher tiers cannot be created
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\permission
   * @access public
   */
  public function save()
  {
    $operation_class_name = lib::get_class_name( 'database\operation' );
    $db_access_role = lib::create( 'database\role', $this->role_id );
    if( $db_access_role->tier > lib::create( 'business\session' )->get_role()->tier )
      throw lib::create( 'exception\permission',
        // fake the operation
        $operation_class_name::get_operation( 'push', 'user', 'new_access' ), __METHOD__ );

    parent::save();
  }
  
  /**
   * Override parent delete method by making sure that higher tiers cannot be deleted
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\permission
   * @access public
   */
  public function delete()
  {
    $operation_class_name = lib::get_class_name( 'database\operation' );
    if( $this->get_role()->tier > lib::create( 'business\session' )->get_role()->tier )
      throw lib::create( 'exception\permission',
        // fake the operation
        $operation_class_name::get_operation( 'push', 'access', 'delete' ), __METHOD__ );

    parent::delete();
  }
}
?>
