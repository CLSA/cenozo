<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * The base class of all query (collection-based get) services
 */
class query extends base_collection
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $path The URL of the service (not including the base)
   * @param array $args An associative array of arguments to be processed by the service.
   * @access public
   */
  public function __construct( $path, $args = NULL )
  {
    parent::__construct( 'GET', $path, $args );
  }

  /**
   * TODO: document
   */
  protected function execute()
  {
    parent::execute();

    if( 0 < count( $this->collection_name_list ) )
    {
      $subject = $this->collection_name_list[0];
      $record_class_name = lib::get_class_name( sprintf( 'database\%s', $subject ) );
      $this->data = $record_class_name::arrayselect( $this->modifier );
    }
  }
}
