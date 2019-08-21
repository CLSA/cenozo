<?php
/**
 * mail_manager.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\business;
use cenozo\lib, cenozo\log;

/**
 * Manages sending mail
 */
class mail_manager extends \cenozo\base_object
{
  /**
   * Set who the mail is from (if not defined then the default from email address will be used (from settings)
   * 
   * @param string $address The email address (DO NOT include angle brackets <>)
   * @param string $name The name (may be NULL if no name is required)
   */
  public function from( $address, $name = NULL )
  {
    $from = static::get_email( array( 'name' => $name, 'address' => $address ) );
    if( is_null( $from ) )
      log::warning( sprintf( 'Tried to set email "From" field to invalid address: "%s", falling back to default value.', $address ) );
    $this->from_email = $from;
  }

  /**
   * Sets the reply-to of the mail
   * 
   * @param string $address The email address (DO NOT include angle brackets <>)
   * @param string $name The name (may be NULL if no name is required)
   */
  public function reply_to( $address, $name = NULL )
  {
    $reply_to = static::get_email( array( 'name' => $name, 'address' => $address ) );
    if( is_null( $from ) ) log::warning( sprintf( 'Tried to set email "Reply-To" field to invalid address: "%s"', $address ) );
    $this->reply_to_email = $reply_to;
  }

  /**
   * Sets the mail's list of recipients
   * 
   * This will replace any existing emails with the list provided
   * @param array $list A list of email addresses (each element must either be an address or an associated array with address and name)
   */
  public function set_to( $list ) { $this->set_email_list( 'to', $list ); }

  /**
   * Add a new recipient to the mail
   * 
   * @param string $address The email address (DO NOT include angle brackets <>)
   * @param string $name The name (may be NULL if no name is required)
   */
  public function to( $address, $name = NULL ) { $this->add_email( 'to', $address, $name ); }

  /**
   * Sets the mail's list of carbon-copies
   * 
   * This will replace any existing emails with the list provided
   * @param array $list A list of email addresses (each element must either be an address or an associated array with address and name)
   */
  public function set_cc( $list ) { $this->set_email_list( 'cc', $list ); }

  /**
   * Add a new carbon-copy to the mail
   * 
   * @param string $address The email address (DO NOT include angle brackets <>)
   * @param string $name The name (may be NULL if no name is required)
   */
  public function cc( $address, $name = NULL ) { $this->add_email( 'cc', $address, $name ); }

  /**
   * Sets the mail's list of blind carbon-copies
   * 
   * This will replace any existing emails with the list provided
   * @param array $list A list of email addresses (each element must either be an address or an associated array with address and name)
   */
  public function set_bcc( $list ) { $this->set_email_list( 'bcc', $list ); }

  /**
   * Add a new blind carbon-copy to the mail
   * 
   * @param string $address The email address (DO NOT include angle brackets <>)
   * @param string $name The name (may be NULL if no name is required)
   */
  public function bcc( $address, $name = NULL ) { $this->add_email( 'bcc', $address, $name ); }

  /**
   * Sets the title of the mail
   */
  public function set_title( $title ) { $this->title = $title; }

  /**
   * Sets the body of the mail
   */
  public function set_body( $body ) { $this->body = $body; }

  /**
   * Sends the email to the provided recipient(s)
   */
  public function send()
  {
    $setting_manager = lib::create( 'business\setting_manager' );
    $headers = array();

    // validate mandatory fields
    if( 0 == count( $this->to_list ) || is_null( $this->title ) || is_null( $this->body ) ) return false;

    // process the "from" email
    $from = $this->from_email;
    if( is_null( $from ) )
    {
      // if there is no "from" email then use the default
      $from = array(
        'address' => $setting_manager->get_setting( 'mail', 'default_from_address' ),
        'name' => $setting_manager->get_setting( 'mail', 'default_from_name' )
      );
    }
    $headers[] = is_null( $from['name'] )
               ? sprintf( 'From: %s', $from['address'] )
               : sprintf( 'From: %s <%s>', iconv( 'UTF-8', 'Windows-1252//TRANSLIT', $from['name'] ), $from['address'] );

    // include the reply-to argument
    if( !is_null( $this->reply_to_email ) )
    {
      $headers[] = is_null( $this->reply_to_email['name'] )
                 ? sprintf( 'Reply-To: %s', $this->reply_to_email['address'] )
                 : sprintf(
                     'Reply-To: %s <%s>',
                     iconv( 'UTF-8', 'Windows-1252//TRANSLIT', $this->reply_to_email['name'] ),
                     $this->reply_to_email['address']
                   );
    }

    // process the "to" email list
    $to_list = array();
    foreach( $this->to_list as $email )
    {
      $to_list[] = is_null( $email['name'] )
                 ? sprintf( '%s', $email['address'] )
                 : sprintf( '%s <%s>', iconv( 'UTF-8', 'Windows-1252//TRANSLIT', $email['name'] ), $email['address'] );
    }

    // process the "cc" email list
    foreach( $this->cc_list as $email )
    {
      $headers[] = is_null( $email['name'] )
                 ? sprintf( 'Cc: %s', $email['address'] )
                 : sprintf( 'Cc: %s <%s>', iconv( 'UTF-8', 'Windows-1252//TRANSLIT', $email['name'] ), $email['address'] );
    }

    // process the "bcc" email list
    foreach( $this->bcc_list as $email )
    {
      $headers[] = is_null( $email['name'] )
                 ? sprintf( 'Bcc: %s', $email['address'] )
                 : sprintf( 'Bcc: %s <%s>', iconv( 'UTF-8', 'Windows-1252//TRANSLIT', $email['name'] ), $email['address'] );
    }

    if( !$setting_manager->get_setting( 'mail', 'enabled' ) )
    {
      log::info( sprintf(
        'Request to send mail "%s" to "%s" not being sent since the mail system is disabled.',
        $this->title,
        implode( ', ', $to_list )
      ) );

      return true;
    }

    return mail(
      implode( ', ', $to_list ),
      iconv( 'UTF-8', 'Windows-1252//TRANSLIT', $this->title ),
      iconv( 'UTF-8', 'Windows-1252//TRANSLIT', $this->body ),
      implode( "\r\n", $headers )
    );
  }

  /**
   * Sets the email list for either "to", "cc" or "bcc"
   * 
   * This will replace any existing emails with the list provided
   * @param array $list A list of email addresses (each element must either be an address or an associated array with address and name)
   */
  protected function set_email_list( $type, $list )
  {
    if( !is_array( $list ) ) $list = array( $list );

    // determine the list type
    $list_type = sprintf( '%s_list', $type );
    if( !property_exists( $this, $list_type ) ) throw lib::create( 'exception\argument', 'type', $type, __METHOD__ );

    $this->$list_type = array();
    foreach( $list as $email )
    {
      $email = static::get_email( $email );
      if( !is_null( $email ) ) array_push( $this->$list_type, $email );
    }
  }

  /**
   * Add a new email to the list of either "to", "cc" or "bcc"
   * 
   * @param string $address The email address (DO NOT include angle brackets <>)
   * @param string $name The name (may be NULL if no name is required)
   */
  protected function add_email( $type, $address, $name = NULL )
  {
    // determine the list type
    $list_type = sprintf( '%s_list', $type );
    if( !property_exists( $this, $list_type ) ) throw lib::create( 'exception\argument', 'type', $type, __METHOD__ );

    $email = static::get_email( array( 'address' => $address, 'name' => $name ) );
    if( !is_null( $email ) ) array_push( $this->$list_type, $email );
  }

  /**
   * Used internally to validate email arguments
   * 
   * @param string/array $email Either an email address or an associative array with address => the email address and name => (optional)
   *        Note that email addresses should never include angle brackets <>
   */
  protected static function get_email( $email )
  {
    $util_class_name = lib::get_class_name( 'util' );

    // if a string is provided then assume it is an email address
    if( is_string( $email ) ) $email = array( 'address' => $email );

    if( !is_array( $email ) || !array_key_exists( 'address', $email ) ) return NULL;

    // check to make sure this is an email address
    if( !$util_class_name::validate_email( $email['address'] ) ) return NULL;

    // if no name is provided then set it to NULL
    if( !array_key_exists( 'name', $email ) ) $email['name'] = NULL;

    return $email;
  }

  /**
   * The email that the mail is from
   */
  protected $from_email = NULL;

  /**
   * The reply-to address to include in the email message
   */
  protected $reply_to_email = NULL;

  /**
   * The list of recipients to address the mail to
   */
  protected $to_list = array();

  /**
   * The list of recipients to carbon-copy the mail to
   */
  protected $cc_list = array();

  /**
   * The list of recipients to blind carbon-copy the mail to
   */
  protected $bcc_list = array();

  /**
   * The title of the mail
   */
  protected $title = NULL;

  /**
   * the body of the mail
   */
  protected $body = NULL;
}
