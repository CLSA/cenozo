<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\activity;
use cenozo\lib, cenozo\log;

/**
 * The base class of all query (collection-based get) services
 */
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
    if( !$this->get_argument( 'close_lapsed', false ) ) parent::execute();
    else
    {
      $activity_class_name = lib::get_class_name( 'database\activity' );
      $this->set_data( $activity_class_name::close_lapsed() );
    }
  }
}
