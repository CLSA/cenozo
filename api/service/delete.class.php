<?php
/**
 * delete.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * The base class of all delete operations.
 */
class delete extends service
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $path The URL of the service (not including the base)
   * @param array $args An associative array of arguments to be processed by the delete operation.
   * @access public
   */
  public function __construct( $path, $args )
  {
    parent::__construct( 'DELETE', $path, $args );
  }

  /**
   * TODO: document
   */
  protected function execute()
  {
    parent::execute();

    if( 0 < count( $this->record_list ) )
    {
      $record = end( $this->record_list );
      try
      {
        $record->delete();
      }
      catch( \cenozo\exception\database $e )
      {
        if( $e->is_constrained() )
        {
          $this->data = $e->get_duplicate_columns( $record->get_class_name() );
          $this->status->set_code( 409 );
        }
        else throw $e;
      }
    }
  }
}
