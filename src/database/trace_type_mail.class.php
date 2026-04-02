<?php
/**
 * trace_type_mail.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * trace_type_mail: record
 */
class trace_type_mail extends \cenozo\database\record
{
  /**
   * Tests the subject and body of an email to make sure the template is valid
   * @return boolean
   * @access public
   */
  public function validate()
  {
    $util_class_name = lib::get_class_name( 'util' );

    // test with any participant
    $db_participant = lib::create( 'database\participant', 1 );

    $errors = array();
    try
    {
      $this->compile_text( $this->subject, $db_participant );
    }
    catch( \cenozo\exception\argument $e )
    {
      preg_match( '/"key" with value [^"]+"([^"]+)"/', $e->get_raw_message(), $matches );
      $errors['subject'] = $matches[1];
    }

    try
    {
      $this->compile_text( $this->body, $db_participant );
    }
    catch( \cenozo\exception\argument $e )
    {
      preg_match( '/"key" with value [^"]+"([^"]+)"/', $e->get_raw_message(), $matches );
      $errors['body'] = $matches[1];
    }

    return 0 < count( $errors ) ? $util_class_name::json_encode( $errors ) : null;
  }

  /**
   * Adds trace mail for the given record
   * @param database\trace $db_trace
   * @access public
   */
  public function add_mail( $db_trace )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $mail_class_name = lib::get_class_name( 'database\mail' );

    // ignore trace records that are of the wrong trace type
    if( $db_trace->trace_type_id != $this->trace_type_id ) return;

    $db_participant = $db_trace->get_participant();
    if( !is_null( $db_participant->email ) )
    {
      $schedule_datetime = $util_class_name::get_datetime_object();

      $schedule_datetime = clone $db_trace->datetime;
      $schedule_datetime->add( new \DateInterval( sprintf(
        'P%d%s',
        $this->delay_offset,
        strtoupper( $this->delay_unit[0] )
      ) ) );

      // don't send future mail that has already passed
      if( $util_class_name::get_datetime_object() >= $schedule_datetime ) return;

      // work on the existing mail if one already exists
      $db_mail = $mail_class_name::get_unique_record(
        array( 'participant_id', 'schedule_datetime' ),
        array( $db_participant->id, $schedule_datetime->format( 'Y-m-d H:i:s' ) )
      );

      // or create a new one of none exists yet
      if( is_null( $db_mail ) ) $db_mail = lib::create( 'database\mail' );

      // add the participant's second email to the cc list
      $cc_address = $this->cc_address;
      if( !is_null( $db_participant->email2 ) )
      {
        $cc_address = (
          is_null( $this->cc_address ) ?
          $db_participant->email2 :
          sprintf( '%s,%s', $db_participant->email2, $cc_address )
        );
      }

      $db_mail->participant_id = $db_participant->id;
      $db_mail->from_name = $this->from_name;
      $db_mail->from_address = $this->from_address;
      $db_mail->to_name = sprintf(
        '%s %s %s',
        $db_participant->honorific,
        $db_participant->first_name,
        $db_participant->last_name
      );
      $db_mail->to_address = $db_participant->email;
      $db_mail->cc_address = $cc_address;
      $db_mail->bcc_address = $this->bcc_address;
      $db_mail->schedule_datetime = $schedule_datetime;
      $db_mail->subject = $this->compile_text( $this->subject, $db_participant );
      $db_mail->body = $this->compile_text( $this->body, $db_participant );
      $db_mail->note = sprintf(
        'Automatically added from a %s trace mail template.',
        $this->get_trace_type()->name
      );
      $db_mail->save();

      // link the mail record to the trace
      static::db()->execute( sprintf(
        'INSERT IGNORE INTO trace_has_mail SET trace_id = %d, mail_id = %d',
        $db_trace->id,
        $db_mail->id
      ) );
    }
  }

  /**
   * Compiles trace mail text, replacing coded variables with actual values
   * @access private
   */
  private function compile_text( $text, $db_participant )
  {
    $data_manager = lib::create( 'business\data_manager' );

    $matches = array();
    preg_match_all( '/\$[^$\s]+\$/', $text, $matches ); // get anything enclosed by $ with no whitespace
    foreach( $matches[0] as $match )
    {
      $value = substr( $match, 1, -1 );
      $replace = 0 === strpos( $value, 'participant.' )
               ? $data_manager->get_participant_value( $db_participant, $value )
               : $data_manager->get_value( $value );

      if( is_null( $replace ) ) throw lib::create( 'exception\argument', 'key', $value, __METHOD__ );
      $text = str_replace( $match, $replace, $text );
    }

    return $text;
  }
}
