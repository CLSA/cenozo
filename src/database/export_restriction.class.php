<?php
/**
 * export_restriction.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier
   * @access public
   */
  public function apply_modifier( $modifier )
  {
    $table_name = $this->get_table_alias();
    if( 'application' == $this->table_name )
      $table_name = str_replace( 'application', 'application_has_participant', $table_name );
    $test = $this->test;
    $value = $this->value;
    if( 'like' == $test || 'not like' == $test )
    {
      if( is_null( $value ) ) $test = '<>';
      else if( false === strpos( $value, '%' ) ) $value = '%'.$value.'%';
    }

    else $modifier->where( $table_name.'.'.$this->column_name, $test, $value, true, 'or' == $this->logic );
  }

  /**
   * Returns the alias used when referencing this column's table
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function get_table_alias()
  {
    if( 'participant' == $this->table_name ) return 'participant';
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
