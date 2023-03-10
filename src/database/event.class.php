<?php
/**
 * event.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * event: record
 */
class event extends record
{
  /**
   * Override parent save method to send mail
   * 
   * @access public
   */
  public function save()
  {
    $is_new = is_null( $this->id );

    parent::save();

    if( $is_new )
    {
      foreach( $this->get_event_type()->get_event_type_mail_object_list() as $db_event_type_mail )
      {
        $db_event_mail = lib::create( 'database\event_mail' );
        $db_event_mail->event_id = $this->id;
        $db_event_mail->to_address = $db_event_type_mail->to_address;
        $db_event_mail->cc_address = $db_event_type_mail->cc_address;
        $db_event_mail->subject = $db_event_type_mail->subject;
        $db_event_mail->body = $db_event_type_mail->body;
        $db_event_mail->send();
      }
    }
  }
}
