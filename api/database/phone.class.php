<?php
/**
 * phone.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * phone: record
 */
class phone extends has_rank
{
  /**
   * Override parent method
   */
  public function save()
  {
    // figure out whether alternate or participant is the rank parent
    static::$rank_parent = !is_null( $this->alternate_id ) ? 'alternate' : 'participant';
    parent::save();
    static::$rank_parent = NULL;
  }

  /**
   * Override parent method
   */
  public function delete()
  {
    // figure out whether alternate or participant is the rank parent
    static::$rank_parent = !is_null( $this->alternate_id ) ? 'alternate' : 'participant';
    parent::delete();
    static::$rank_parent = NULL;
  }

  /**
   * Extend parent method
   */
  public static function get_unique_record( $column, $value )
  {
    $record = NULL;

    // make use of the uq_alternate_id_participant_id_rank pseudo unique key
    if( is_array( $column ) && 2 == count( $column ) && in_array( 'rank', $column ) &&
        ( in_array( 'participant_id', $column ) || in_array( 'alternate_id', $column ) ) )
    {
      $select = lib::create( 'database\select' );
      $select->from( static::get_table_name() );
      $select->add_column( static::get_primary_key_name() );
      $modifier = lib::create( 'database\modifier' );
      foreach( $column as $index => $name ) $modifier->where( $name, '=', $value[$index] );

      // this returns null if no records are found
      $id = static::db()->get_one( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );
      if( !is_null( $id ) ) $record = new static( $id );
    }
    else
    {
      $record = parent::get_unique_record( $column, $value );
    }

    return $record;
  }

  /**
   * The type of record which the record has a rank for.
   * @var string
   * @access protected
   * @static
   */
  protected static $rank_parent = NULL;
}
