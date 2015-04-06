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
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $path The URL of the service (not including the base)
   * @param array $args An associative array of arguments to be processed by the service.
   * @access public
   */
  public function __construct( $path, $args = NULL )
  {
    parent::__construct( 'HEAD', $path, $args );
  }

  /**
   * TODO: document
   */
  protected function execute()
  {
    parent::execute();

    // get the list of the LAST collection
    $index = count( $this->collection_name_list ) -1;
    if( 0 <= $index )
    {
      $subject = $this->collection_name_list[$index];
      $record_class_name = lib::get_class_name( sprintf( 'database\%s', $subject ) );
      $this->headers['Columns'] = $record_class_name::db()->get_column_details( $subject );
    }
  }
}
