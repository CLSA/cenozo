<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\system_message;
use cenozo\lib, cenozo\log;

class post extends \cenozo\service\post
{
  /**
   * Extends parent method
   */
  protected function prepare()
  {
    parent::prepare();

    $session = lib::create( 'business\session' );
    $db_role = $session->get_role();
    $db_system_message = $this->get_leaf_record();

    // force application_id if needed
    if( 3 > $db_role->tier ) $db_system_message->application_id = $session->get_application()->id;

    // force site_id if needed
    if( !$db_role->all_sites ) $db_system_message->site_id = $session->get_site()->id;
  }
}
