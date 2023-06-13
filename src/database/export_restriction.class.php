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
      $check_array = array(
        'has_alternate', 'has_decedent', 'has_emergency',
        'has_informant', 'has_informant_with_consent', 'has_proxy', 'has_proxy_with_consent'
      );
      if( in_array( $this->column_name, $check_array ) )
      {
        $matches = array();
        preg_match( '/has_([^_]+)(_with_consent)?/', $this->column_name, $matches );
        $alternate_type = $matches[1];
        $with_consent = array_key_exists( 2, $matches ) && '_with_consent' == $matches[2];

        // specify a special column
        $column = sprintf( '%s.total > 0', $table_name );

        // join to the appropriate table
        $alternate_table_name = $this->column_name;
        if( !$modifier->has_join( $alternate_table_name ) )
        {
          $alternate_sel = lib::create( 'database\select' );
          $alternate_sel->from( 'participant' );
          $alternate_sel->add_column( 'id', 'participant_id' );
          $alternate_sel->add_column( 'SUM( IF( alternate.id IS NULL, 0, 1 ) )', 'total', false );

          $alternate_mod = lib::create( 'database\modifier' );
          $join_mod = lib::create( 'database\modifier' );
          $join_mod->where( 'participant.id', '=', 'alternate.participant_id', false );
          $join_mod->where( 'alternate.active', '=', true );
          $alternate_mod->join_modifier( 'alternate', $join_mod, 'left' );

          if( 'alternate' != $alternate_type )
          {
            $db_alternate_type = $alternate_type_class_name::get_unique_record( 'name', $alternate_type );
            $alternate_type_table_name = sprintf( 'alternate_has_%s_alternate_type', $alternate_type );
            $join_mod = lib::create( 'database\modifier' );
            $join_mod->where( 'alternate.id', '=', sprintf( '%s.alternate_id', $alternate_type_table_name ), false );
            $join_mod->where( sprintf( '%s.alternate_type_id', $alternate_type_table_name ), '=', $db_alternate_type->id );
            $alternate_mod->join_modifier( 'alternate_has_alternate_type', $join_mod, 'left', $alternate_type_table_name );
          }
          $alternate_mod->group( 'participant.id' );
          $alternate_mod->order( 'participant.id' );

          $sql = sprintf(
            'CREATE TEMPORARY TABLE IF NOT EXISTS %s ('."\n".
            '  participant_id INT UNSIGNED NOT NULL,'."\n".
            '  total INT UNSIGNED NOT NULL,'."\n".
            '  PRIMARY KEY( participant_id )'."\n".
            ')'."\n".
            '%s %s',
            $alternate_table_name,
            $alternate_sel->get_sql(),
            $alternate_mod->get_sql()
          );
          static::db()->execute( $sql );
          $modifier->join( $alternate_table_name, 'participant.id', $alternate_table_name.'.participant_id' );
        }
      }
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
