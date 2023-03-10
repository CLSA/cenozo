<?php
/**
 * event_mail.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * event_mail: record
 */
class event_mail extends record
{
  /**
   * Sends all mail associated with this record
   * 
   * @access public
   * @static
   */
  public function send()
  {
    $util_class_name = lib::get_class_name( 'util' );
    $db_application = lib::create( 'business\session' )->get_application();

    // do not re-send mail
    if( $this->sent ) return;

    // make sure we have everything we need
    if( is_null( $this->event_id ) )
      throw lib::create( 'exception\runtime', 'Tried to send event_mail with no event_id.', __METHOD__ );
    if( is_null( $this->to_address ) )
      throw lib::create( 'exception\runtime', 'Tried to send event_mail with no to_address.', __METHOD__ );
    if( is_null( $this->subject ) )
      throw lib::create( 'exception\runtime', 'Tried to send event_mail with no subject.', __METHOD__ );
    if( is_null( $this->body ) )
      throw lib::create( 'exception\runtime', 'Tried to send event_mail with no body.', __METHOD__ );

    // compile the subject and body, and mark the datetime that it is being sent
    $this->compile_text();
    $this->sent = false;
    $this->datetime = $util_class_name::get_datetime_object();

    // warn if the application isn't configured for sending mail
    if( is_null( $db_application->mail_address ) )
    {
      log::warning( sprintf(
        'Event mail not sent because %s application\'s mail_address property is not set.',
        $db_application->name
      ) );
    }
    else
    {
      // configure the mail manager
      $mail_manager = lib::create( 'business\mail_manager' );
      $mail_manager->to( $this->to_address );
      $mail_manager->from( $db_application->mail_address, $db_application->mail_name );
      if( !is_null( $this->cc_address ) )
        foreach( explode( ',', $this->cc_address ) as $address ) $mail_manager->cc( trim( $address ) );
      $mail_manager->set_subject( $this->subject );
      $mail_manager->set_body( $this->body, false );

      // send the email and mark the result
      $this->sent = $mail_manager->send(); // this won't send if the mail manager is disabled
    }

    $this->save();
  }

  /**
   * Compiles the event_mail's subject and body, replacing coded variables with actual values
   * @access private
   */
  private function compile_text()
  {
    $data_manager = lib::create( 'business\data_manager' );
    $db_participant = $this->get_event()->get_participant();

    // look for $participant...$ in the subject and body
    $matches = array();
    preg_match_all( '/\$[^$]+\$/', $this->subject, $matches );
    foreach( $matches[0] as $match )
    {
      $value = substr( $match, 1, -1 );
      try
      {
        $replace = 0 === strpos( $value, 'participant.' )
                 ? $data_manager->get_participant_value( $db_participant, $value )
                 : $data_manager->get_value( $value );

        $this->subject = str_replace( $match, $replace, $this->subject );
      }
      // ignore argument exceptions and leave the match unchanged
      catch( \cenozo\exception\argument $e ) {}
    }

    $matches = array();
    preg_match_all( '/\$[^$]+\$/', $this->body, $matches );
    foreach( $matches[0] as $match )
    {
      $value = substr( $match, 1, -1 );
      try
      {
        $replace = 0 === strpos( $value, 'participant.' )
                 ? $data_manager->get_participant_value( $db_participant, $value )
                 : $data_manager->get_value( $value );

        $this->body = str_replace( $match, $replace, $this->body );
      }
      // ignore argument exceptions and leave the match unchanged
      catch( \cenozo\exception\argument $e ) {}
    }
  }
}
