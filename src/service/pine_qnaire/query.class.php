<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\pine_qnaire;
use cenozo\lib, cenozo\log;

/**
 * Extends parent class
 */
class query extends \cenozo\service\query
{
  /**
   * Override parent method
   */
  protected function prepare()
  {
    // NOTE: purposely not calling the parent method
  }

  /**
   * Extends parent method
   */
  protected function execute()
  {
    $sel_string = $this->get_argument( 'select', NULL );
    $mod_string = $this->get_argument( 'modifier', NULL );

    $cenozo_manager = lib::create( 'business\cenozo_manager', 'pine' );
    if( $cenozo_manager->exists() )
    {
      $url = 'qnaire?no_activity=1';
      if( !is_null( $sel_string ) ) $url .= '&'.$sel_string;
      if( !is_null( $mod_string ) ) $url .= '&'.$mod_string;

      // get data from pine and pass it along
      $data = $cenozo_manager->get( $url );
      $this->set_data( $data );
    }
    else
    {
      $this->set_data( array() );
    }
  }
}
