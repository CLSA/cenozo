<?php
/**
 * head.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\script;
use cenozo\lib, cenozo\log;

/**
 * The base class of all head services
 */
class head extends \cenozo\service\head
{
  /**
   * Extends parent method
   */
  protected function setup()
  {
    parent::setup();

    $this->columns['create_event_types'] = array(
      'data_type' => 'tinyint',
      'default' => '1',
      'required' => '1'
    );
  }
}
