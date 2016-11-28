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
    $column = NULL;
    $table_name = $this->get_table_alias();
    if( 'auxiliary' == $this->table_name )
    {
      if( in_array( $this->column_name, array( 'has_alternate', 'has_informant', 'has_proxy' ) ) )
      {
        // specify a special column
        $column = sprintf( '%s.total > 0', $table_name );

        // join to the appropriate table
        $alternate_type = substr( $this->column_name, 4 );
        $alternate_table_name = $this->column_name;
        if( !$modifier->has_join( $alternate_table_name ) )
        {
          $sql = sprintf(
            'CREATE TEMPORARY TABLE IF NOT EXISTS %s ('."\n".
            '  participant_id INT UNSIGNED NOT NULL,'."\n".
            '  total INT UNSIGNED NOT NULL,'."\n".
            '  PRIMARY KEY( participant_id )'."\n".
            ')'."\n".
            'SELECT participant.id AS participant_id, IF( alternate.id IS NULL, 0, COUNT(*) ) AS total'."\n".
            'FROM participant'."\n".
            'LEFT JOIN alternate ON participant.id = alternate.participant_id'."\n".
            '      AND alternate.%s = true'."\n".
            'GROUP BY participant.id'."\n".
            'ORDER BY participant.id',
            $alternate_table_name,
            $alternate_type
          );
          static::db()->execute( $sql );
          $modifier->join( $alternate_table_name, 'participant.id', $alternate_table_name.'.participant_id' );
        }
      }
    }
    else
    {
      if( 'application' == $this->table_name )
        $table_name = str_replace( 'application', 'application_has_participant', $table_name );
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function get_table_alias()
  {
    if( 'participant' == $this->table_name ) return 'participant';
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
