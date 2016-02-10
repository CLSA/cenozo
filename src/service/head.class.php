<?php
/**
 * head.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * The base class of all head services
 */
class head extends read
{
  /**
   * Extends parent constructor
   */
  public function __construct( $path, $args = NULL )
  {
    parent::__construct( 'HEAD', $path, $args );
  }

  /**
   * Extends parent method
   */
  protected function execute()
  {
    parent::execute();

    // get the details of the leaf record
    $record_class_name = $this->get_leaf_record_class_name();
    $this->headers['Columns'] = $record_class_name::db()->get_column_details( $this->get_leaf_subject() );
  }
}
