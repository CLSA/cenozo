<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\equipment_type\equipment;
use cenozo\lib, cenozo\log;

class post extends \cenozo\service\post
{
  /**
   * Replace parent method
   */
  protected function prepare()
  {
    parent::prepare();

    // force the site_id if the current role doesn't have all-site access
    $session = lib::create( 'business\session' );
    $db_role = $session->get_role();
    $db_site = $session->get_site();
    if( !$db_role->all_sites )
    {
      $record = $this->get_leaf_record();
      $record->site_id = $db_site->id;
    }
  }
}
