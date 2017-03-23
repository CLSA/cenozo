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
   * Override parent save method by making sure that higher tiers cannot be created
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\permission
   * @access public
   */
  public function save()
  {
    if( is_null( $this->id ) )
    {
      // do not allow access to a higher tier or all-site (if the user doesn't have all-site access)
      $db_role = lib::create( 'business\session' )->get_role();
      $db_access_role = $this->get_role();
      if( $db_access_role->tier > $db_role->tier || ( !$db_role->all_sites && $db_access_role->all_sites ) )
        throw lib::create( 'exception\permission', 'Access creation', __METHOD__ );
    }

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
    $db_role = lib::create( 'business\session' )->get_role();
    $db_access_role = $this->get_role();
    if( $db_access_role->tier > $db_role->tier || ( !$db_role->all_sites && $db_access_role->all_sites ) )
      throw lib::create( 'exception\permission', 'Access removal', __METHOD__ );

    parent::delete();
  }

  /**
   * Determines whether the access has expired (timed-out)
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access public
   */
  public function has_expired()
  {
    $activity_class_name = lib::get_class_name( 'database\activity' );
    $modifier = $activity_class_name::get_expired_modifier();
    $modifier->where( 'id', '=', $this->id );

    return 0 < static::count( $modifier );
  }
}
