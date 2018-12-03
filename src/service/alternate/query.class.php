<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\alternate;
use cenozo\lib, cenozo\log;

class query extends \cenozo\service\query
{
  /**
   * Extends parent method
   */
  protected function execute()
  {
    if( $this->get_argument( 'update_first_address', false ) )
    {
      $alternate_class_name = lib::get_class_name( 'database\alternate' );
      $this->set_data( $alternate_class_name::update_all_first_address() );
    }
    else
    {
      parent::execute();
    }
  }
}
