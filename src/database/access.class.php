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
      if( $this->get_role()->tier > lib::create( 'business\session' )->get_role()->tier )
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
    if( $this->get_role()->tier > lib::create( 'business\session' )->get_role()->tier )
      throw lib::create( 'exception\permission', 'Access removal', __METHOD__ );

    parent::delete();
  }
}
