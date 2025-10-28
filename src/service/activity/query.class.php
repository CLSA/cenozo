<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\activity;
use cenozo\lib, cenozo\log;

class query extends \cenozo\service\query
{
  /**
   * Extends parent method
   */
  protected function prepare()
  {
    if( !$this->get_argument( 'close_lapsed', false ) ) parent::prepare();
  }

  /**
   * Extends parent method
   */
  protected function execute()
  {
    $activity_class_name = lib::get_class_name( 'database\activity' );

    if( $this->get_argument( 'close_lapsed', false ) )
    {
      $this->set_data( $activity_class_name::close_lapsed() );
    }
    else
    {
      parent::execute();
    }
  }
}
