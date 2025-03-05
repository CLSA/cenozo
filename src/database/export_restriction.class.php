<?php
/**
 * export_restriction.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * export_restriction: record
 */
class export_restriction extends has_rank
{
  /**
   * Applies this record's changes to the given modifier
   * 
   * @param database\modifier $modifier
   * @access public
   */
  public function apply_modifier( $modifier )
  {
    $alternate_type_class_name = lib::get_class_name( 'database\alternate_type' );

    $column = NULL;
    $table_name = $this->get_table_alias();
    if( 'auxiliary' == $this->table_name )
    {
      // need to add the collection ID to the table name (for is_in_collection only)
      if( 'is_in_collection' == $this->column_name )
        $table_name = sprintf( '%s_%d', $this->column_name, $this->subtype );

      // both the has_* and is_in_collection restrictions rely on the total column in the temporary table
      $column = sprintf( '%s.total > 0', $table_name );
    }
    else
    {
      if( 'application' == $this->table_name )
      {
        $table_name = str_replace( 'application', 'application_has_participant', $table_name );
      }
      else if( 'participant' == $this->table_name )
      {
        if( 'relation_type_id' == $this->column_name )
        {
          if( !$modifier->has_join( 'relation' ) )
            $modifier->left_join( 'relation', 'participant.id', 'relation.participant_id' );
          $table_name = 'relation';
        }
      }
      $column = sprintf( '%s.%s', $table_name, $this->column_name );
    }

    $test = $this->test;
    $value = $this->value;
    if( 'like' == $test || 'not like' == $test )
    {
      if( is_null( $value ) ) $test = '<>';
      else if( false === strpos( $value, '%' ) ) $value = '%'.$value.'%';
    }

    $modifier->where( $column, $test, $value, true, 'or' == $this->logic );
  }

  /**
   * Returns the alias used when referencing this column's table
   * 
   * @access public
   */
  public function get_table_alias()
  {
    if( in_array( $this->table_name, array( 'hin', 'hold', 'participant', 'phone', 'proxy', 'trace' ) ) )
      return $this->table_name;
    else if( 'auxiliary' == $this->table_name ) return $this->column_name;
    else if( 'site' == $this->table_name || 'address' == $this->table_name )
      return $this->subtype.'_'.$this->table_name;
    return $this->table_name.'_'.$this->subtype;
  }

  /**
   * The type of record which the record has a rank for.
   * @var string
   * @access protected
   * @static
   */
  protected static $rank_parent = 'export';
}
