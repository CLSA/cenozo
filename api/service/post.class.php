<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * The base class of all post operations.
 */
class post extends service
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $path The URL of the service (not including the base)
   * @param array $args An associative array of arguments to be processed by the post operation.
   * @param string $file The raw file posted by the request
   * @access public
   */
  public function __construct( $path, $args, $file )
  {
    parent::__construct( 'POST', $path, $args, $file );
  }

  /**
   * TODO: document
   */
  protected function execute()
  {
    parent::execute();

    // create a record for the LAST collection
    $index = count( $this->collection_name_list ) - 1;
    if( 0 <= $index )
    {
      $subject = $this->collection_name_list[$index];

      $object = $this->get_file_as_object();
      $record = lib::create( sprintf( 'database\%s', $subject ) );

      foreach( $record->get_column_names() as $column_name )
      {
        if( 'id' != $column_name )
        {
          if( property_exists( $object, $column_name ) )
            $record->$column_name = $object->$column_name;
        }
      }

      try
      {
        // save the record, set the data as the new id
        $record->save();
        $this->data = (int)$record->id;

        // set up the status to show a successfully created resource
        $this->status->set_code( 201 );
        $this->status->set_location( sprintf( '%s/%d', $subject, $record->id ) );
      }
      catch( \cenozo\exception\database $e )
      {
        if( $e->is_duplicate_entry() )
        { // conflict, return offending columns
          $this->data = $e->get_duplicate_columns( $record->get_class_name() );
          $this->status->set_code( 409 );
        }
        else if( $e->is_missing_data() ) $this->status->set_code( 400 );
        else throw $e;
      }
    }
  }
}
