<?php
/**
 * note.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * A base class for all records which have notes.
 */
abstract class has_note extends record
{
  /**
   * Gets the number of notes associated with this record.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param modifier $modifier
   * @return int
   * @access public
   */
  public function get_note_count( $modifier = NULL )
  {
    $table_name = static::get_table_name();
    $subject_key_name = $table_name.'_'.static::get_primary_key_name();
    $note_class_name = lib::get_class_name( 'database\\'.$table_name.'_note' );

    if ( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
    $modifier->where( $subject_key_name, '=', $this->id );
    return $note_class_name::count( $modifier );
  }

  /**
   * Gets the list of notes associated with this record.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param modifier $modifier
   * @return array( record )
   * @access public
   */
  public function get_note_list( $select = NULL, $modifier = NULL )
  {
    $table_name = static::get_table_name();
    $subject_key_name = $table_name.'_'.static::get_primary_key_name();
    $note_class_name = lib::get_class_name( 'database\\'.$table_name.'_note' );

    if ( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
    $modifier->where( $subject_key_name, '=', $this->id );
    $modifier->order( 'sticky', true );
    $modifier->order_desc( 'datetime' );
    return $note_class_name::select( $select, $modifier );
  }

  /**
   * Gets the list of notes associated with this record.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param modifier $modifier
   * @return array( record )
   * @access public
   */
  public function get_note_object_list( $modifier = NULL )
  {
    $table_name = static::get_table_name();
    $subject_key_name = $table_name.'_'.static::get_primary_key_name();
    $note_class_name = lib::get_class_name( 'database\\'.$table_name.'_note' );

    if ( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
    $modifier->where( $subject_key_name, '=', $this->id );
    $modifier->order( 'sticky', true );
    $modifier->order_desc( 'datetime' );
    return $note_class_name::select_objects( $modifier );
  }

  /**
   * Adds a new note to the record.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\user $db_user
   * @param string $note
   * @access public
   */
  public function add_note( $db_user, $note )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $table_name = static::get_table_name();
    $subject_key_name = $table_name.'_'.static::get_primary_key_name();
    $db_note = lib::create( 'database\\'.$table_name.'_note' );
    $db_note->user_id = $db_user->id;
    $db_note->$subject_key_name = $this->id;
    $db_note->datetime = $util_class_name::get_datetime_object();
    $db_note->note = $note;
    $db_note->save();
  }

  /**
   * Adds a new note to multiple records.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier
   * @param database\user $db_user
   * @param string $note
   * @static
   * @access public
   */
  public static function multinote( $modifier, $db_user, $note )
  {
    // validate parameters
    if( !is_object( $db_user ) || 'user' != $db_user->get_class_name() )
      throw lib::create( 'exception\argument', 'db_user', $db_user, __METHOD__ );
    if( !is_string( $note ) || 0 == strlen( $note ) )
      throw lib::create( 'exception\argument', 'note', $note, __METHOD__ );

    $database_class_name = lib::get_class_name( 'database\database' );
    $util_class_name = lib::get_class_name( 'util' );

    $table_name = static::get_table_name();
    $subject_key_name = $table_name.'_'.static::get_primary_key_name();

    $sql = sprintf(
      'INSERT INTO %s_note( create_timestamp, %s, user_id, datetime, note ) '.
      "\n".'SELECT NULL, id, %s, %s, %s '.
      "\n".'FROM %s %s',
      $table_name,
      $subject_key_name,
      static::db()->format_string( $db_user->id ),
      static::db()->format_datetime( $util_class_name::get_datetime_object() ),
      static::db()->format_string( $note ),
      $table_name,
      $modifier->get_sql() );
    static::db()->execute( $sql );
  }

  /**
   * Gets a note record (new or existing) for this record type.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param integer $id
   * @return note record
   * @static
   * @access public
   */
  public static function get_note( $id = NULL )
  {
    return lib::create( 'database\\'.static::get_table_name().'_note', $id );
  }
}
