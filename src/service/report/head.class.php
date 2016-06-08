<?php
/**
 * head.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\report;
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

    $this->columns['report_schedule'] = array(
      'data_type' => 'tinyint',
      'default' => '1',
      'required' => '0'
    );
  }
}
