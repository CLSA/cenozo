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
   * Refer to the participant or alternate instead of the person record
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param int $key A primary key value for the table.
   * @return associative array
   * @static
   * @access public
   */
  public static function get_unique_from_primary_key( $key )
  {
    $unique_key_array = parent::get_unique_from_primary_key( $key );

    $record = new static( $key );
    $db_participant = $record->get_person()->get_participant();
    $db_alternate = $record->get_person()->get_alternate();
    if( !is_null( $db_participant ) ) 
    {   
      $participant_class_name = lib::get_class_name( 'database\participant' );
      $unique_key_array['participant_id'] =
        $participant_class_name::get_unique_from_primary_key( $db_participant->id );
      unset( $unique_key_array['person_id'] );
    }   
    else if( !is_null( $db_alternate ) ) 
    {   
      $alternate_class_name = lib::get_class_name( 'database\alternate' );
      $unique_key_array['alternate_id'] =
        $alternate_class_name::get_unique_from_primary_key( $db_alternate->id );
      unset( $unique_key_array['person_id'] );
    }   

    return $unique_key_array;
  }

  /**
   * Replace alternate_id/participant_id with person_id in unique key
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param associative array
   * @return int
   * @static
   * @access public
   */
  public static function get_primary_from_unique_key( $key )
  {
    // we may have a stdObject, so convert to an array if we do
    if( is_object( $key ) ) $key = (array) $key;
    if( !is_array( $key ) ) return NULL;

    if( array_key_exists( 'participant_id', $key ) )
    {
      $participant_class_name = lib::get_class_name( 'database\participant' );
      $db_participant = lib::create( 'database\participant',
        $participant_class_name::get_primary_from_unique_key( $key['participant_id'] ) );
      $key['person_id'] = !is_null( $db_participant ) ? $db_participant->person_id : NULL;
      unset( $key['participant_id'] );
    }
    else if( array_key_exists( 'alternate_id', $key ) )
    {
      $alternate_class_name = lib::get_class_name( 'database\alternate' );
      $db_alternate = lib::create( 'database\alternate',
        $alternate_class_name::get_primary_from_unique_key( $key['alternate_id'] ) );
      $key['person_id'] = !is_null( $db_alternate ) ? $db_alternate->person_id : NULL;
      unset( $key['alternate_id'] );
    }

    return parent::get_primary_from_unique_key( $key );
  }

  /**
   * The type of record which the record has a rank for.
   * @var string
   * @access protected
   * @static
   */
  protected static $rank_parent = 'person';
}
