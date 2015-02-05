<?php
/**
 * patch.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * The base class of all patch operations.
 */
class patch extends service
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $path The URL of the service (not including the base)
   * @param array $args An associative array of arguments to be processed by the patch operation.
   * @param string $file The raw file posted by the request
   * @access public
   */
  public function __construct( $path, $args, $file )
  {
    parent::__construct( 'PATCH', $path, $args, $file );
  }

  /**
   * TODO: document
   */
  protected function execute()
  {
    $record = end( $this->record_list );
    if( false !== $record )
    {
      $object = $this->get_file_as_object();
      foreach( get_object_vars( $object ) as $key => $value )
      {
        try
        {
          $record->$key = $value;
          $this->status->set_code( 204 );
        }
        catch( \cenozo\exception\argument $e )
        {
          // argument exception means the column doesn't exist
          $this->status->set_code( 400 );
          break;
        }
      }

      if( 300 > $this->status->get_code() )
      {
        try
        {
          $record->save();
        }
        catch( \cenozo\exception\database $e )
        {
          if( $e->is_duplicate_entry() ) $this->status->set_code( 409 );
          else if( $e->is_missing_data() ) $this->status->set_code( 400 );
          else throw $e;           
        }
      }
    }
  }
}
