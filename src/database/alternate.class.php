<?php
/**
 * alternate.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * alternate: record
 */
class alternate extends has_note
{
  /**
   * Audit changes to email and email 2 fields by overriding the magic __set method
   * @param string $column_name The name of the column
   * @param mixed $value The value to set the contents of a column to
   * @throws exception\argument
   * @access public
   */
  public function __set( $column_name, $value )
  {
    $old_email = $this->email;
    $old_email2 = $this->email2;

    parent::__set( $column_name, $value );

    if( 'email' == $column_name && $old_email != $this->email )
    {
      $util_class_name = lib::get_class_name( 'util' );
      $this->email_datetime = $util_class_name::get_datetime_object();
      $this->email_old = $old_email;
    }
    else if( 'email2' == $column_name && $old_email2 != $this->email2 )
    {
      $util_class_name = lib::get_class_name( 'util' );
      $this->email2_datetime = $util_class_name::get_datetime_object();
      $this->email2_old = $old_email2;
    }
  }

  /**
   * Re-determines the first address for all alternates
   * 
   * @return integer (the number of affected alternates)
   * @static 
   * @access public
   */
  public static function update_all_first_address()
  {
    $sub_sel = lib::create( 'database\select' );
    $sub_sel->from( 'address' );
    $sub_sel->add_column( 'MIN( address.rank )', 'max_rank', false );
    $sub_mod = lib::create( 'database\modifier' );
    $sub_mod->where( 'address.active', '=', true );
    $sub_mod->where( 'alternate.id', '=', 'address.alternate_id', false );
    $sub_mod->where(
      "CASE MONTH( CURRENT_DATE() )\n".
      "  WHEN 1 THEN address.january\n".
      "  WHEN 2 THEN address.february\n".
      "  WHEN 3 THEN address.march\n".
      "  WHEN 4 THEN address.april\n".
      "  WHEN 5 THEN address.may\n".
      "  WHEN 6 THEN address.june\n".
      "  WHEN 7 THEN address.july\n".
      "  WHEN 8 THEN address.august\n".
      "  WHEN 9 THEN address.september\n".
      "  WHEN 10 THEN address.october\n".
      "  WHEN 11 THEN address.november\n".
      "  WHEN 12 THEN address.december\n".
      "ELSE 0 END", "=", 1
    );
    $sub_mod->group( 'address.alternate_id' );

    $join_mod = lib::create( 'database\modifier' );
    $join_mod->where( 'alternate.id', '=', 'address.alternate_id', false );
    $join_mod->where( 'address.rank', '<=>', sprintf( '( %s%s )', $sub_sel->get_sql(), $sub_mod->get_sql() ), false );
    $modifier = lib::create( 'database\modifier' );
    $modifier->join_modifier( 'address', $join_mod, 'left' );

    $select = lib::create( 'database\select' );
    $select->from( 'alternate' );
    $select->add_table_column( 'alternate', 'id', 'alternate_id' );
    $select->add_table_column( 'address', 'id', 'address_id' );

    static::db()->execute( sprintf(
      "INSERT INTO alternate_first_address( alternate_id, address_id )\n".
      "%s%s\n".
      "ON DUPLICATE KEY UPDATE address_id = VALUES( address_id )",
      $select->get_sql(),
      $modifier->get_sql()
    ) );

    // divide affected rows by 2 since every row that gets changed will count as 2 rows
    return static::db()->affected_rows() / 2;
  }
}
