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
    $table_name = $this->get_export_column()->get_table_alias();
    $test = $this->test;
    $value = $this->value;
    if( 'like' == $test || 'not like' == $test )
    {
      if( is_null( $value ) ) $test = '<>';
      else if( false === strpos( $value, '%' ) ) $value = '%'.$value.'%';
    }
    $modifier->where( $table_name.'.'.$this->column_name, $test, $value, true, 'or' == $this->logic );
  }

  /**
   * The type of record which the record has a rank for.
   * @var string
   * @access protected
   * @static
   */
  protected static $rank_parent = 'export';
}
