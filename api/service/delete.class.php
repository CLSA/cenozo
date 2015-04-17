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
class delete extends write
{
  /**
   * Extends parent constructor
   */
  public function __construct( $path, $args )
  {
    parent::__construct( 'DELETE', $path, $args );
  }

  /**
   * Extends parent method
   */
  protected function execute()
  {
    parent::execute();

    $relationship_class_name = lib::get_class_name( 'database\relationship' );

    $leaf_record = $this->get_leaf_record();
    $leaf_subject = $this->get_leaf_subject();
    if( !is_null( $leaf_subject ) )
    {
      $many_to_many = false;
      // check for n-to-n relationships between parent and child
      if( $relationship_class_name::MANY_TO_MANY === $this->get_leaf_parent_relationship() )
      {
        $method = sprintf( 'remove_%s', $leaf_subject );
        $this->get_parent_record()->$method( $leaf_record->id );
        $many_to_many = true;
      }

      if( !$many_to_many )
      {
        try
        {
          $leaf_record->delete();
        }
        catch( \cenozo\exception\database $e )
        {
          if( $e->is_constrained() )
          {
            $this->data = $e->get_duplicate_columns( $leaf_record->get_class_name() );
            $this->status->set_code( 409 );
          }
          else
          {
            $this->status->set_code( 500 );
            throw $e;
          }
        }
      }
    }
  }
}
