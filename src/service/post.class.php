<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * The base class of all post services.
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
  protected function prepare()
  {
    parent::prepare();

    $relationship_class_name = lib::get_class_name( 'database\relationship' );

    if( $relationship_class_name::MANY_TO_MANY !== $this->get_leaf_parent_relationship() )
    {
      $record = $this->get_leaf_record();
      $parent_record = $this->get_parent_record();

      if( !is_null( $record ) )
      {
        if( !is_null( $parent_record ) )
        { // add the parent relationship
          $parent_column = sprintf( '%s_id', $parent_record::get_table_name() );
          if( $record->column_exists( $parent_column ) ) $record->$parent_column = $parent_record->id;
        }

        // add record column data
        $post_object = $this->get_file_as_object();
        if( is_object( $post_object ) )
          foreach( $record->get_column_names() as $column_name )
            if( 'id' != $column_name && property_exists( $post_object, $column_name ) )
              $record->$column_name = $post_object->$column_name;
      }
    }
  }

  /**
   * Extends parent method
   */
  protected function validate()
  {
    parent::validate();

    if( 300 > $this->status->get_code() )
    {
      $relationship_class_name = lib::get_class_name( 'database\relationship' );
      if( $relationship_class_name::MANY_TO_MANY !== $this->get_leaf_parent_relationship() )
      {
        if( is_null( $this->get_leaf_record() ) ) $this->status->set_code( 400 );
      }
      else // many-to-many
      {
        $post_object = $this->get_file_as_object();
        if( is_object( $post_object ) )
        {
          if( !property_exists( $post_object, 'add' ) && !property_exists( $post_object, 'remove' ) )
            $this->status->set_code( 400 );
        }
        else if( !is_int( $post_object ) && !is_array( $post_object ) )
        {
          $this->status->set_code( 400 );
        }
      }
    }
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
        $parent_record = $this->get_parent_record();
        $post_object = $this->get_file_as_object();
        if( is_int( $post_object ) )
        {
          $method = 'add_'.$leaf_subject;
          $parent_record->$method( $post_object );
        }
        else if( is_object( $post_object ) )
        {
          if( property_exists( $post_object, 'add' ) )
          {
            $method = 'add_'.$leaf_subject;
            $parent_record->$method( $post_object->add );
          }
          if( property_exists( $post_object, 'remove' ) )
          {
            $method = 'remove_'.$leaf_subject;
            $parent_record->$method( $post_object->remove );
          }
        }
        else if( is_array( $post_object ) )
        {
          $method = 'replace_'.$leaf_subject;
          $parent_record->$method( $post_object );
        }

        $this->status->set_code( 201 );
      }
      else
      {
        $record = $this->get_leaf_record();
        try
        {
          // save the record, set the data as the new id
          $record->save();
          $primary_key_name = $record::get_primary_key_name();
          $this->set_data( (int)$record->$primary_key_name );

          // set up the status to show a successfully created resource
          $this->status->set_code( 201 );
          $this->status->set_location( sprintf( '%s/%d', $leaf_subject, $record->$primary_key_name ) );
        }
        catch( \cenozo\exception\database $e )
        {
          if( $e->is_duplicate_entry() )
          { // conflict, return offending columns
            $this->set_data( $e->get_duplicate_columns( $record->get_class_name() ) );
            $this->status->set_code( 409 );
          }
          else
          {
            $this->status->set_code( $e->is_missing_data() ? 400 : 500 );
            throw $e;
          }
        }
      }
    }
  }

  /**
   * Extends parent method
   */
  protected function create_resource( $index )
  {
    $relationship_class_name = lib::get_class_name( 'database\relationship' );
    return $this->get_number_of_collections() - 1 == $index &&
           $relationship_class_name::MANY_TO_MANY !== $this->get_leaf_parent_relationship() ?
      lib::create( $this->get_record_class_name( $index, true ) ) : parent::create_resource( $index );
  }
}
