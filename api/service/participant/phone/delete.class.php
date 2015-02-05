<?php
/**
 * delete.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\participant\phone;
use cenozo\lib, cenozo\log;

/**
 * Custom class for delete requests
 */
class delete extends \cenozo\service\delete
{
  /**
   * TODO: document
   */
  protected function get_resource( $index )
  {
    $record = NULL;

    $collection_name = $this->collection_name_list[$index];
    $resource_value = $this->resource_value_list[$index];

    // if we're using a unique key and the record has a parent then we need to add
    // "person_id" into the key instead of the default "participant_id"
    if( 0 < $index &&
        array_key_exists( $index, $this->collection_name_list ) &&
        array_key_exists( $index, $this->resource_value_list ) &&
        false !== strpos( $resource_value, '=' ) )
    {
      $record_class_name = lib::get_class_name( sprintf( 'database\%s', $collection_name ) );

      $columns = array();
      $values = array();
      foreach( explode( ';', $resource_value ) as $part )
      {
        $pair = explode( '=', $part );
        if( 2 == count( $pair ) )
        {
          $columns[] = $pair[0];
          $values[] = $pair[1];
        }
      }

      if( 0 < count( $columns ) )
      {
        // add "person_id" to the unique key
        $parent_record = $this->record_list[$index-1];
        $columns[] = 'person_id';
        $values[] = $parent_record->person_id;
        $record = $record_class_name::get_unique_record( $columns, $values );
      }
    }

    return is_null( $record ) ? parent::get_resource( $index ) : $record;
  }
}
