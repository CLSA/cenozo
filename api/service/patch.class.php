<?php
/**
 * patch.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui;
use cenozo\lib, cenozo\log;

/**
 * The base class of all patch operations.
 */
class patch extends base_resource
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $path The URL of the service (not including the base)
   * @param array $args An associative array of arguments to be processed by the patch operation.
   * @access public
   */
  public function __construct( $path, $args )
  {
    parent::__construct( 'PATCH', $path, $args );
  }

  /**
   * TODO: document
   */
  protected function execute()
  {
    if( !is_null( $this->record ) )
    { // TODO: patch the record
    }
  }
}
