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
class post extends write
{
  /**
   * Extends parent constructor
   */
  public function __construct( $path, $args, $file )
  {
    parent::__construct( 'POST', $path, $args, $file );
  }

  /**
   * Extends parent method
   */
  protected function execute()
  {
    parent::execute();

    $relationship_class_name = lib::get_class_name( 'database\relationship' );
      
    $leaf_subject = $this->get_leaf_subject();
    if( !is_null( $leaf_subject ) )
    {
      if( $relationship_class_name::MANY_TO_MANY === $this->get_leaf_parent_relationship() )
      {
        $id = $this->get_file_as_object();
        if( !is_int( $id ) && !is_array( $id ) )
        {
          $this->status->set_code( 400 );
        }
        else
        {
          $method = sprintf( 'add_%s', $leaf_subject );
          $this->get_parent_record()->$method( $id );
          $this->status->set_code( 201 );
        }
      }
      else
      {
        $record = $this->get_leaf_record();

        try
        {
          // save the record, set the data as the new id
          $record->save();
          $this->data = (int)$record->id;

          // set up the status to show a successfully created resource
          $this->status->set_code( 201 );
          $this->status->set_location( sprintf( '%s/%d', $leaf_subject, $record->id ) );
        }
        catch( \cenozo\exception\database $e )
        {
          if( $e->is_duplicate_entry() )
          { // conflict, return offending columns
            $this->data = $e->get_duplicate_columns( $record->get_class_name() );
            $this->status->set_code( 409 );
          }
          else if( $e->is_missing_data() ) $this->status->set_code( 400 );
          else
          {
            $this->status->set_code( 500 );
            throw $e;
          }
        }
      }
    }
  }

  /**
   * TODO: document
   */
  protected function get_leaf_record()
  {
    if( is_null( $this->new_record ) )
    {
      // create a record for the LAST collection
      $object = $this->get_file_as_object();
      $this->new_record = lib::create( sprintf( 'database\%s', $this->get_leaf_subject() ) );
  
      $parent_record = $this->get_parent_record();
      if( !is_null( $parent_record ) )
      { // add the parent relationship
        $parent_column = sprintf( '%s_id', $parent_record::get_table_name() );
        $this->new_record->$parent_column = $parent_record->id;
      }
  
      foreach( $this->new_record->get_column_names() as $column_name )
        if( 'id' != $column_name && property_exists( $object, $column_name ) )
          $this->new_record->$column_name = $object->$column_name;
    }

    return $this->new_record;
  }

  /**
   * TODO: document
   */
  private $new_record = NULL;
}
