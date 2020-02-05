<?php
/**
 * mail.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * mail: record
 */
class mail extends record
{
  /**
   * Override parent method
   */
  public function delete()
  {
    // do not allow mail to be deleted once it has been sent
    if( !is_null( $this->sent ) )
      throw lib::create( 'exception\runtime', 'Tried to delete a mail record after it has already been sent.', __METHOD__ );
      
    parent::delete();
  }

  /**
   * Sends the mail as an email message
   * 
   * @return Returns whether or not the message was 
   * @access public
   * @static
   */
  public function send()
  {
    $util_class_name = lib::get_class_name( 'util' );
    $setting_manager = lib::create( 'business\setting_manager' );

    if( !is_null( $this->sent_datetime ) )
    {
      log::warning( sprintf( 'Tried to send mail id %d which has already been sent.', $this->id ) );
    }
    else
    {
      $mail_manager = lib::create( 'business\mail_manager' );
      $mail_manager->to( $this->to_address, $this->to_name );
      $mail_manager->from( $this->from_address, $this->from_name );
      if( !is_null( $this->cc_address ) )
        foreach( explode( ',', $this->cc_address ) as $address ) $mail_manager->cc( trim( $address ) );
      if( !is_null( $this->bcc_address ) )
        foreach( explode( ',', $this->bcc_address ) as $address ) $mail_manager->bcc( trim( $address ) );
      $mail_manager->set_subject( $this->subject );
      $mail_manager->set_body( $this->body );
      
      $this->sent = $setting_manager->get_setting( 'mail', 'enabled' ) && $mail_manager->send();
      $this->sent_datetime = $util_class_name::get_datetime_object();
      $this->save();
    }
  }

  /**
   * Sends all queued mail
   * 
   * @return Returns the number of mail messages sent
   * @access public
   * @static
   */
  public static function send_queued()
  {
    $count = 0;

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'sent_datetime', '=', NULL );
    $modifier->where( 'schedule_datetime', '<', 'UTC_TIMESTAMP()', false );

    foreach( static::select_objects( $modifier ) as $db_mail )
    {
      $db_mail->send();
      if( !is_null( $db_mail->sent_datetime ) ) $count++;
    }

    return $count;
  }
}
