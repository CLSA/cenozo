<?php
/**
 * proxy.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * proxy: record
 */
class proxy extends record
{
  /**
   * Overrides the parent save method.
   * @access public
   */
  public function save()
  {
    $db_participant = lib::create( 'database\participant', $this->participant_id );

    // when adding new proxys, make sure the last proxy's type is not empty
    if( is_null( $this->id ) && is_null( $this->proxy_type_id ) )
    {
      $db_proxy = $db_participant->get_last_proxy();
      if( is_null( $db_proxy ) || is_null( $db_proxy->proxy_type_id ) )
        throw lib::create( 'exception\runtime', 'Tried to unnecessarily cancel a proxy.', __METHOD__ );
    }

    parent::save();
  }
}
