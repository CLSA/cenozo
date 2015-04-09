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
class put extends write
{
  /**
   * Extends parent constructor
   */
  public function __construct( $path, $args, $file )
  {
    parent::__construct( 'PUT', $path, $args, $file );
  }

  /**
   * Extends parent method
   */
  protected function execute()
  {
    parent::execute();

    $leaf_record = $this->get_leaf_record();
    if( !is_null( $leaf_record ) )
    {
      $object = $this->get_file_as_object();

      foreach( $leaf_record->get_column_names() as $column_name )
      {
        if( !property_exists( $object, $column_name ) )
        { // missing column
          $this->status->set_code( 400 );
          break;
        }
        else if( 'id' == $column_name )
        {
          // DO NOT allow the ID to be changed
          if( $leaf_record->id != $object->id )
          {
            $this->status->set_code( 400 );
            break;
          }
        }
        else
        {
          $leaf_record->$column_name = $object->$column_name;
        }
      }

      if( 300 > $this->status->get_code() )
      {
        try
        {
          $leaf_record->save();
          $this->status->set_code( 204 );
        }
        catch( \cenozo\exception\database $e )
        {
          if( $e->is_duplicate_entry() )
          {
            $this->data = $e->get_duplicate_columns( $leaf_record->get_class_name() );
            $this->status->set_code( 409 );
          }
          else if( $e->is_missing_data() ) $this->status->set_code( 400 );
          else throw $e;           
        }
      }
    }
  }
}
