<?php
/**
 * email_report.class.php
 * 
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\pull;
use cenozo\lib, cenozo\log;

/**
 * Mailout required report data.
 * 
 * @abstract
 */
class email_report extends \cenozo\ui\pull\base_report
{
  /**
   * Constructor
   * 
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param array $args Pull arguments.
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'email', $args );
  }

  /**
   * Builds the report.
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access protected
   */
  protected function build()
  {
    $util_class_name = lib::get_class_name( 'util' );
    $participant_class_name = lib::get_class_name( 'database\participant' );

    $restrict_collection_id = $this->get_argument( 'restrict_collection_id' );
    $db_collection = $restrict_collection_id
                   ? lib::create( 'database\collection', $restrict_collection_id )
                   : NULL;
    $restrict_language_id = $this->get_argument( 'restrict_language_id' );
    $db_language = $restrict_language_id
                 ? lib::create( 'database\language', $restrict_language_id )
                 : NULL;
    $type = $this->get_argument( 'type' );
    $restrict_start_date = $this->get_argument( 'restrict_start_date' );
    $restrict_end_date = $this->get_argument( 'restrict_end_date' );
    $start_datetime_obj = NULL;
    $end_datetime_obj = NULL;

    if( 0 < strlen( $restrict_start_date ) )
      $start_datetime_obj = $util_class_name::get_datetime_object( $restrict_start_date );
    if( 0 < strlen( $restrict_end_date ) )
      $end_datetime_obj = $util_class_name::get_datetime_object( $restrict_end_date );
    if( 0 < strlen( $restrict_start_date ) && 0 < strlen( $restrict_end_date ) &&
        $end_datetime_obj < $start_datetime_obj )
    {
      $temp_datetime_obj = clone $start_datetime_obj;
      $start_datetime_obj = clone $end_datetime_obj;
      $end_datetime_obj = clone $temp_datetime_obj;
    }

    if( !is_null( $db_collection ) )
      $this->add_title( 'restricted to the "'.$db_collection->name.'" collection' );

    if( !is_null( $db_language ) )
      $this->add_title( 'restricted to the "'.$db_language->name.'" language' );

    // loop through all participants whose email_datetime is inside the datespan
    $participant_mod = lib::create( 'database\modifier' );
    $participant_mod->where( 'email_datetime', '!=', NULL ); // don't include unchanged emails
    if( !is_null( $db_collection ) )
      $participant_mod->where(
        'collection_has_participant.collection_id', '=', $db_collection->id );
    if( !is_null( $db_language ) )
      $participant_mod->where( 'language_id', '=', $db_language->id );
    if( !is_null( $start_datetime_obj ) )
      $participant_mod->where( 'email_datetime', '>=',
        $start_datetime_obj->format( 'Y-m-d 00:00:00' ) );
    if( !is_null( $end_datetime_obj ) )
      $participant_mod->where( 'email_datetime', '<=',
        $end_datetime_obj->format( 'Y-m-d 23:59:59' ) );
    $participant_mod->where( 'email', 'removed' == $type ? '=' : '!=', NULL );

    $contents = array();
    foreach( $participant_class_name::select( $participant_mod ) as $db_participant )
    {
      $db_language = $db_participant->get_language();
      $contents[] = array(
        is_null( $db_language ) ? 'none' : $db_language->name,
        $db_participant->first_name,
        $db_participant->last_name,
        $db_participant->email_old,
        $db_participant->email,
        $util_class_name::get_formatted_date( $db_participant->email_datetime ) );
    }

    $header = array(
      'Language',
      'First Name',
      'Last Name',
      'Previous Email',
      'Email',
      'Date Changed' );

    $this->add_table( NULL, $header, $contents, NULL );
  }
}
