<?php
/**
 * get.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * The base class of all get (single-resource) services
 */
class get extends read
{
  /**
   * Extends parent constructor
   */
  public function __construct( $path, $args = NULL )
  {
    parent::__construct( 'GET', $path, $args );
  }

  /**
   * Extends parent method
   */
  protected function execute()
  {
    parent::execute();

    $leaf_record = $this->get_leaf_record();
    $this->set_data( is_null( $leaf_record ) ?
      NULL : $leaf_record->get_column_values( $this->select, $this->modifier ) );
  }
}
