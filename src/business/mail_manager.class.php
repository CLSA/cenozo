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
   * Defines whether the mail should be encoded as HTML
   * 
   * @param boolean $enabled
   */
  public function set_html( $enabled ) { $this->html = $enabled; }

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
   * Sets the subject of the mail
   */
  public function set_subject( $subject ) { $this->subject = $subject; }

  /**
   * Sets the body of the mail
   */
  public function set_body( $body, $add_header_and_footer = true  )
  {
    $db_application = lib::create( 'business\session' )->get_application();

    $this->body = $body;

    if( $add_header_and_footer )
    {
      // add the application's mail header/footer
      if( !is_null( $db_application->mail_header ) )
      {
        // if the header has html but the body doesn't then convert line breaks to <br>s
        if( false !== strpos( $db_application->mail_header, '<html>' ) &&
            0 == preg_match( '/<[^>]+>/', $this->body ) )
        {
          $this->body = preg_replace( '/\r?\n/', '<br>$0', $this->body );
        }
        $this->body = sprintf( "%s\n%s", $db_application->mail_header, $this->body );
      }

      if( !is_null( $db_application->mail_footer ) )
      {
        $this->body = sprintf( "%s\n%s", $this->body, $db_application->mail_footer );
      }
    }

    // if the body contains the <html> tag then assume this is an html encoded email
    if( false !== strpos( $this->body, '<html>' ) ) $this->html = true;
  }

  /**
   * Sends the email to the provided recipient(s)
   */
  public function send()
  {
    $util_class_name = lib::get_class_name( 'util' );

    $setting_manager = lib::create( 'business\setting_manager' );
    $headers = array();

    // define html headers if requested
    if( $this->html )
    {
      $headers[] = 'MIME-Version: 1.0';
      $headers[] = 'Content-type: text/html; charset=iso-8859-1';
    }

    // validate mandatory fields
    if( 0 == count( $this->to_list ) || is_null( $this->subject ) || is_null( $this->body ) ) return false;

    // process the "from" email
    $from = $this->from_email;

    // if we have no from then use the default from and reply-to addresses
    if( is_null( $from ) )
    {
      // if there is no "from" email then use the default
      $from = array(
        'address' => $setting_manager->get_setting( 'mail', 'default_from_address' ),
        'name' => $setting_manager->get_setting( 'mail', 'default_from_name' )
      );
    }
    $headers[] = sprintf( 'From: %s', static::encode_email( $from ) );
    $headers[] = sprintf( 'Reply-To: %s', static::encode_email( $from ) );

    // process the "to", "cc" and "bcc" email lists
    $to_list = array();
    foreach( $this->to_list as $email ) $to_list[] = static::encode_email( $email );
    foreach( $this->cc_list as $email ) $headers[] = sprintf( 'Cc: %s', static::encode_email( $email ) );
    foreach( $this->bcc_list as $email ) $headers[] = sprintf( 'Bcc: %s', static::encode_email( $email ) );

    if( !$setting_manager->get_setting( 'mail', 'enabled' ) )
    {
      log::info( sprintf(
        'Request to send mail "%s" to "%s" not being sent since the mail system is disabled.',
        $this->subject,
        implode( ', ', $to_list )
      ) );

      return true;
    }

    return mail(
      implode( ', ', $to_list ),
      $util_class_name::convert_charset( $this->subject ),
      $util_class_name::convert_charset( $this->body ),
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
   * Encodes email addresses in UTF-8 (ensures names and addresses with accents will work)
   * @param array $email Contains "address" and may contain "name"
   * @return array
   */
  protected static function encode_email( $email )
  {
    $util_class_name = lib::get_class_name( 'util' );

    // Only encode the address if there are accents (underscores won't work when we encode, so we have to hope we won't send email to
    // an address with both accents and underscores!
    $to = $email['address'];
    if( preg_match( '/[ÀàÁáÂâÃãÄäÇçÈèÉéÊêËëÌìÍíÎîÏïÑñÒòÓóÔôÕõÖöŠšÚùÛúÜûÙüÝýŸÿŽž]/', $to ) )
      $to = mb_encode_mimeheader( $to, 'UTF-8', 'Q' );

    // if there's a name convert the charset and add it to the "to" field
    if( !is_null( $email['name'] ) ) $to = sprintf( '%s <%s>', $util_class_name::convert_charset( $email['name'] ), $to );

    return $to;
  }

  /**
   * Whether to encode the mail as HTML
   */
  protected $html = false;

  /**
   * The email that the mail is from
   */
  protected $from_email = NULL;

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
   * The subject of the mail
   */
  protected $subject = NULL;

  /**
   * the body of the mail
   */
  protected $body = NULL;
}
