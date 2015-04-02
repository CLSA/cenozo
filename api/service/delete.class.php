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

    $relationship_class_name = lib::get_class_name( 'database\relationship' );

    $index = count( $this->collection_name_list ) - 1;
    if( 0 <= $index )
    {
      $many_to_many = false;
      if( 0 < $index )
      { // check for n-to-n relationships between parent and child
        $parent_record = $this->record_list[$index-1];
        $leaf_subject = $this->collection_name_list[$index];
        if( $relationship_class_name::MANY_TO_MANY == $parent_record::get_relationship( $leaf_subject ) )
        {
          $child_record = $this->record_list[$index];
          $method = sprintf( 'remove_%s', $leaf_subject );
          $parent_record->$method( $child_record->id );
          $many_to_many = true;
        }
      }

      if( !$many_to_many )
      {
        $record = $this->record_list[$index];
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
}
