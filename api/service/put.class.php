<?php
/**
 * put.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * The base class of all put operations.
 */
class put extends service
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $path The URL of the service (not including the base)
   * @param array $args An associative array of arguments to be processed by the put operation.
   * @param string $file The raw file posted by the request
   * @access public
   */
  public function __construct( $path, $args, $file )
  {
    parent::__construct( 'PUT', $path, $args, $file );
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

      foreach( $record->get_column_names() as $column_name )
      {
        if( !property_exists( $object, $column_name ) )
        { // missing column
          $this->status->set_code( 400 );
          break;
        }
        else if( 'id' == $column_name )
        {
          // DO NOT allow the ID to be changed
          if( $record->id != $object->id )
          {
            $this->status->set_code( 400 );
            break;
          }
        }
        else
        {
          $record->$column_name = $object->$column_name;
        }
      }

      if( 300 > $this->status->get_code() )
      {
        try
        {
          $record->save();
          $this->status->set_code( 204 );
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
