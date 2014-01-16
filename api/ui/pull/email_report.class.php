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

    $language = $this->get_argument( 'language' );
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

    $this->add_title( 'any' == $language ?
      'for all languages' : 'restricted to the language "'.$language.'"' );

    // loop through all participants whose email_datetime is inside the datespan
    $participant_mod = lib::create( 'database\modifier' );
    $participant_mod->where( 'email_datetime', '!=', NULL ); // don't include unchanged emails
    if( 'any' != $language )
      $participant_mod->where( 'language', '=', $language );
    if( !is_null( $start_datetime_obj ) )
      $participant_mod->where( 'email_datetime', '>=',
        $start_datetime_obj->format( 'Y-m-d 00:00:00' ) );
    if( !is_null( $end_datetime_obj ) )
      $participant_mod->where( 'email_datetime', '<=',
        $end_datetime_obj->format( 'Y-m-d 00:00:00' ) );

    $contents = array();
    foreach( $participant_class_name::select( $participant_mod ) as $db_participant )
    {
      $contents[] = array(
        $db_participant->language,
        $db_participant->first_name,
        $db_participant->last_name,
        $db_participant->email,
        $util_class_name::get_formatted_date( $db_participant->email_datetime ) );
    }

    $header = array(
      'Language',
      'First Name',
      'Last Name',
      'Email',
      'Date Changed' );

    $this->add_table( NULL, $header, $contents, NULL );
  }
}
