<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\application;
use cenozo\lib, cenozo\log;

class query extends \cenozo\service\query
{
  /**
   * Extends parent method
   */
  protected function prepare()
  {
    if( !$this->get_argument( 'archive', false ) ) parent::prepare();
  }

  /**
   * Extends parent method
   */
  protected function execute()
  {
    $application_class_name = lib::get_class_name( 'database\application' );

    if( $this->get_argument( 'archive', false ) )
    {
      $this->set_data( $application_class_name::archive() );
    }
    else
    {
      parent::execute();
    }
  }
}
