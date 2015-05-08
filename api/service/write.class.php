<?php
/**
 * write.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * The base class of all write services
 */
class write extends service
{
  /**
   * Extends parent method
   */
  protected function setup()
  {
    parent::setup();

    // modify the record based on the module
    $leaf_module = $this->get_leaf_module();
    if( !is_null( $leaf_module ) ) $leaf_module->pre_write( $this->get_leaf_record() );
  }

  /**
   * Extends parent method
   */
  protected function finish()
  {
    parent::finish();

    // modify the record based on the module
    $leaf_module = $this->get_leaf_module();
    if( !is_null( $leaf_module ) ) $leaf_module->post_write( $this->get_leaf_record() );
  }
}

