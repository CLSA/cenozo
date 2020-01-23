<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\mail;
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
    if( !$this->get_argument( 'send_queued', false ) ) parent::prepare();
  }

  /**
   * Extends parent method
   */
  protected function execute()
  {
    if( !$this->get_argument( 'send_queued', false ) ) parent::execute();
    else
    {
      $mail_class_name = lib::get_class_name( 'database\mail' );
      $this->set_data( $mail_class_name::send_queued() );
    }
  }
}
