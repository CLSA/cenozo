<?php
/**
 * person.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * A base class for all records which have a one-to-one relationship to person
 */
class person extends has_note
{
  /**
   * Returns the participant associated with this person, or NULL if the person is not
   * associated with a participant.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return database\participant
   * @access public
   */
  public function get_participant()
  {
    // this method is for person records only
    if( 'person' != $this->get_class_name() ) return parent::get_participant();

    // no primary id means no participant
    if( is_null( $this->id ) ) return NULL;

    $participant_class_name = lib::create( 'database\participant' );
    return $participant_class_name::get_unique_record( 'person_id', $this->id );
  }

  /**
   * Returns the alternate associated with this person, or NULL if the person is not
   * associated with a alternate.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return database\alternate
   * @access public
   */
  public function get_alternate()
  {
    // this method is for person records only
    if( 'person' != $this->get_class_name() ) return parent::get_alternate();

    // no primary id means no alternate
    if( is_null( $this->id ) ) return NULL;

    $alternate_class_name = lib::create( 'database\alternate' );
    return $alternate_class_name::get_unique_record( 'person_id', $this->id );
  }

  /**
   * Override get_address_list()
   */
  public function get_address_list( $select = NULL, $modifier = NULL )
  {
    return 'person' == $this->get_class_name()
         ? parent::get_address_list( $select, $modifier )
         : $this->get_person()->get_address_list( $select, $modifier );
  }
  
  /**
   * Override get_address_object_list()
   */
  public function get_address_object_list( $modifier = NULL )
  {
    return 'person' == $this->get_class_name()
         ? parent::get_address_object_list( $modifier )
         : $this->get_person()->get_address_object_list( $modifier );
  }
  
  /**
   * Override get_address_count()
   */
  public function get_address_count( $modifier = NULL )
  {
    return 'person' == $this->get_class_name()
         ? parent::get_address_count( $modifier )
         : $this->get_person()->get_address_count( $modifier );
  }
  
  /**
   * Override remove_address()
   */
  public function remove_address( $id )
  {
    if( 'person' == $this->get_class_name() ) parent::remove_address( $id );
    else $this->get_person()->remove_address( $id );
  }

  /**
   * Override get_phone_list()
   */
  public function get_phone_list( $select = NULL, $modifier = NULL )
  {
    return 'person' == $this->get_class_name()
         ? parent::get_phone_list( $select, $modifier )
         : $this->get_person()->get_phone_list( $select, $modifier );
  }
  
  /**
   * Override get_phone_object_list()
   */
  public function get_phone_object_list( $modifier = NULL )
  {
    return 'person' == $this->get_class_name()
         ? parent::get_phone_object_list( $modifier )
         : $this->get_person()->get_phone_object_list( $modifier );
  }
  
  /**
   * Override get_phone_count()
   */
  public function get_phone_count( $modifier = NULL )
  {
    return 'person' == $this->get_class_name()
         ? parent::get_phone_count( $modifier )
         : $this->get_person()->get_phone_count( $modifier );
  }

  /**
   * Override remove_phone method (since phone is related to person)
   */
  public function remove_phone( $id )
  {
    if( 'person' == $this->get_class_name() ) parent::remove_phone( $id );
    else $this->get_person()->remove_phone( $id );
  }

  /**
   * Override parent method (since note is related to person)
   */
  public function get_note_count( $modifier = NULL )
  {
    $person_id = 'person' == $this->get_class_name() ? $this->id : $this->person_id;
    $note_class_name = lib::get_class_name( 'database\person_note' );
    if ( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'person_id', '=', $person_id );
    return $note_class_name::count( $modifier );
  }

  /**
   * Override parent method (since note are related to person)
   */
  public function get_note_list( $select = NULL, $modifier = NULL )
  {
    $person_id = 'person' == $this->get_class_name() ? $this->id : $this->person_id;
    $note_class_name = lib::get_class_name( 'database\person_note' );
    if ( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'person_id', '=', $person_id );
    $modifier->order( 'sticky', true );
    $modifier->order_desc( 'datetime' );
    return $note_class_name::select( $select, $modifier );
  }

  /**
   * Override parent method (since note are related to person)
   */
  public function get_note_object_list( $modifier = NULL )
  {
    $person_id = 'person' == $this->get_class_name() ? $this->id : $this->person_id;
    $note_class_name = lib::get_class_name( 'database\person_note' );
    if ( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'person_id', '=', $person_id );
    $modifier->order( 'sticky', true );
    $modifier->order_desc( 'datetime' );
    return $note_class_name::select_objects( $modifier );
  }

  /**
   * Override parent method (since all extending class notes are related to the person table)
   */
  public function add_note( $user, $note )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $person_id = 'person' == $this->get_class_name() ? $this->id : $this->person_id;
    $db_note = lib::create( 'database\person_note' );
    $db_note->user_id = $user->id;
    $db_note->person_id = $person_id;
    $db_note->datetime = $util_class_name::get_datetime_object();
    $db_note->note = $note;
    $db_note->save();
  }

  /**
   * Override parent method (since all extending class notes are related to the person table)
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
    
    $sql = sprintf(
      'INSERT INTO person_note( create_timestamp, person_id, user_id, datetime, note ) '.
      'SELECT NULL, person.id, %s, %s, %s '.
      'FROM %s '.
      'JOIN person ON %s.person_id = person.id %s',
      static::db()->format_string( $db_user->id ),
      static::db()->format_string( $util_class_name::get_datetime_object()->format( 'Y-m-d H:i:s' ) ),
      static::db()->format_string( $note ),
      $table_name,
      $table_name,
      $modifier->get_sql() );
    static::db()->execute( $sql );
  }

  /**
   * Override parent method (since note are related to person)
   */
  public static function get_note( $id = NULL )
  {
    return lib::create( 'database\person_note', $id );
  }
}
