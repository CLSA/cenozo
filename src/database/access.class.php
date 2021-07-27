<?php
/**
 * access.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @throws exception\permission
   * @access public
   */
  public function save()
  {
    if( is_null( $this->id ) && !$this->is_modification_allowed() )
      throw lib::create( 'exception\permission', 'Access creation', __METHOD__ );

    parent::save();
  }

  /**
   * Override parent delete method by making sure that higher tiers cannot be deleted
   * 
   * @throws exception\permission
   * @access public
   */
  public function delete()
  {
    if( !$this->is_modification_allowed() ) throw lib::create( 'exception\permission', 'Access removal', __METHOD__ );

    parent::delete();
  }

  /**
   * Determines whether the access has expired (timed-out)
   * 
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

  /* 
   * Determines if the current role can add/remove this access
   * @return boolean
   */
  public function is_modification_allowed()
  {
    // do not allow access to a higher tier or all-site (if the user doesn't have all-site access)
    $db_role = lib::create( 'business\session' )->get_role();
    $db_access_role = $this->get_role();
    return $db_access_role->tier <= $db_role->tier && ( $db_role->all_sites || !$db_access_role->all_sites );
  }
}
