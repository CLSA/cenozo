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

    // make sure not to add duplicate proxys
    if( is_null( $this->id ) )
    {
      $db_last_proxy = $db_participant->get_last_proxy();
      $last_proxy_type_id = is_null( $db_last_proxy ) ? NULL : $db_last_proxy->proxy_type_id;
      if( $last_proxy_type_id == $this->proxy_type_id )
        throw lib::create( 'exception\runtime', 'Tried to add duplicate proxy.', __METHOD__ );
    }

    parent::save();
  }
}
