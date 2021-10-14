<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\script;
use cenozo\lib, cenozo\log;

class query extends \cenozo\service\query
{
  /**
   * Extends parent method
   */
  protected function execute()
  {
    if( $this->get_argument( 'update_data', false ) )
    {
      $script_class_name = lib::get_class_name( 'database\script' );
      $this->set_data( $script_class_name::update_data() );
    }
    else
    {
      parent::execute();
    }
  }
}
