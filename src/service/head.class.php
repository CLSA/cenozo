<?php
/**
 * head.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
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
  protected function setup()
  {
    parent::setup();

    // get the details of the leaf record
    $util_class_name = lib::get_class_name( 'util' );
    $record_class_name = $this->get_leaf_record_class_name();
    $this->columns = $record_class_name::db()->get_column_details( $this->get_leaf_subject() );
  }

  /**
   * Extends parent method
   */
  protected function execute()
  {
    parent::execute();

    // get the details of the leaf record
    $util_class_name = lib::get_class_name( 'util' );
    $record_class_name = $this->get_leaf_record_class_name();
    $this->headers['Columns'] = $util_class_name::json_encode( $this->columns );
  }

  /**
   * The column details to be returned in a header
   * @array $columns
   * @access protected
   */
  protected $columns = NULL;
}
