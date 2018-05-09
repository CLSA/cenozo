<?php
/**
 * sid_record.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database\limesurvey;
use cenozo\lib, cenozo\log;

/**
 * Access to limesurvey's *_SID tables.
 * 
 * Since limesurvey's database structure for some tables is dynamic this class overrides
 * much of the functionality in record class as is appropriate.
 */
abstract class sid_record extends record
{
  /**
   * Returns the current SID for all records of this class type.
   * @return int
   * @access public
   * @static
   */
  public static function get_sid()
  {
    $class_index = lib::get_class_name( get_called_class(), true );
    return array_key_exists( $class_index, self::$table_sid_list )
         ? self::$table_sid_list[$class_index] : NULL;
  }

  /**
   * Sets the current SID for all records of this class type.
   * Make sure to call this method BEFORE using any normal or static methods.
   * @param int $sid
   * @access public
   * @static
   */
  public static function set_sid( $sid )
  {
    $class_index = lib::get_class_name( get_called_class(), true );
    if( !is_null( $sid ) ) self::$table_sid_list[$class_index] = $sid;
  }

  /**
   * Returns the name of the table associated with this record.
   * @return string
   * @access public
   * @static
   */
  public static function get_table_name()
  {
    if( is_null( static::get_sid() ) )
    {
      throw lib::create( 'exception\runtime',
        'The survey id (table_sid) must be set before using this class.', __METHOD__ );
    }

    return sprintf( '%s_%s', parent::get_table_name(), static::get_sid() );
  }

  /**
   * Override parent method
   */
  public static function get_unique_record( $column, $value )
  {
    // column and value may be arrays
    if( is_array( $column ) && 1 == count( $column ) ) $column = $column[0];
    if( is_array( $value ) && 1 == count( $value ) ) $value = $value[0];

    if( 'token' == $column || 'uid' == $column )
    {
      $select = lib::create( 'database\select' );
      $select->from( static::get_table_name() );
      $select->add_column( static::$primary_key_name );
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'token', '=', $value );
      $id = static::db()->get_one( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );
      return !is_null( $id ) ? new static( $id ) : NULL;
    }

    return parent::get_unique_record( $column, $value );
  }

  /**
   * The table's current sid.  This is an array since every class must track its own sid
   * separately.
   * @var array(int)
   * @access private
   */
  private static $table_sid_list = array();
}
