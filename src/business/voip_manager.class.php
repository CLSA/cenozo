<?php
/**
 * voip_manager.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\business;
use cenozo\lib, cenozo\log;

require_once SHIFT8_PATH.'/library/Shift8.php';

/**
 * Manages VoIP communications.
 */
class voip_manager extends \cenozo\singleton
{
  /**
   * Constructor.
   * 
   * @access protected
   */
  protected function __construct()
  {
    $setting_manager = lib::create( 'business\setting_manager' );
    if( !$setting_manager->get_setting( 'module', 'voip' ) )
    {
      throw lib::create( 'exception\runtime',
        'Tried to create the voip-manager but the voip module is not enabled.',
        __METHOD__ );
    }

    $setting_manager = lib::create( 'business\setting_manager' );
    $this->enabled = true === $setting_manager->get_setting( 'voip', 'enabled' );
    $this->url = sprintf(
      'http://%s:%d/mxml',
      $setting_manager->get_setting( 'voip', 'domain' ),
      $setting_manager->get_setting( 'voip', 'mxml_port' )
    );
    $this->username = $setting_manager->get_setting( 'voip', 'username' );
    $this->password = $setting_manager->get_setting( 'voip', 'password' );
    $this->prefix = $setting_manager->get_setting( 'voip', 'prefix' );
  }

  /**
   * Initializes the voip manager.
   * 
   * This method should be called immediately after initial construction of the manager
   * @throws exception\runtime, exception\voip
   * @access public
   */
  public function initialize()
  {
    if( !$this->enabled || !is_null( $this->manager ) ) return;

    try
    {
      // create and connect to the shift8 AJAM interface
      $this->manager = new \Shift8( $this->url, $this->username, $this->password );
      if( !$this->manager->login() )
        throw lib::create( 'exception\runtime',
          'Unable to connect to the Asterisk server.', __METHOD__ );
    }
    catch( \Shift8_Exception $e )
    {
      throw lib::create( 'exception\voip',
        'Failed to initialize Asterisk AJAM interface.', __METHOD__, $e );
    }
  }

  /**
   * Performs all shutdown actions
   * @access public
   */
  public function shutdown()
  {
    if( $this->enabled && $this->manager ) $this->manager->logoff();
  }

  /**
   * Returns sip info for the given user (or current user if null)
   * @param database\user or integer $user
   * @return array
   * @access public
   */
  public function get_sip_info( $user = NULL )
  {
    if( !$this->enabled ) return;
    $this->initialize();

    // get the current SIP info
    $peer = static::get_peer_from_user( $user );
    $s8_event = $this->manager->getSipPeer( $peer );

    $sip_info = NULL;
    if( !is_null( $s8_event ) )
    {
      $peer = $s8_event->get( 'objectname' );
      $sip_info = array(
        'peer' => $peer,
        'user' => static::get_user_from_peer( $peer ),
        'status' => $s8_event->get( 'status' ),
        'type' => $s8_event->get( 'channeltype' ),
        'agent' => $s8_event->get( 'sip_useragent' ),
        'ip' => $s8_event->get( 'address_ip' ),
        'port' => $s8_event->get( 'address_port' )
      );
    }

    return $sip_info;
  }

  /**
   * Returns sip info for all users
   * @return array( array )
   * @access public
   */
  public function get_sip_info_list()
  {
    if( !$this->enabled ) return;
    $this->initialize();

    // get the current SIP info
    $s8_event_list = $this->manager->getSipPeers();

    $sip_info_list = array();
    if( is_array( $s8_event_list ) ) foreach( $s8_event_list as $s8_event )
    {
      $peer = $s8_event->get( 'objectname' );
      array_push( $sip_info_list, array(
        'peer' => $peer,
        'user' => static::get_user_from_peer( $peer ),
        'status' => $s8_event->get( 'status' ),
        'type' => $s8_event->get( 'channeltype' ),
        'agent' => $s8_event->get( 'sip_useragent' ),
        'ip' => $s8_event->get( 'address_ip' ),
        'port' => $s8_event->get( 'address_port' )
      ) );
    }

    return $sip_info_list;
  }

  /**
   * Reads the list of active calls from the server.
   * 
   * @throws exception\voip
   * @access public
   */
  public function rebuild_call_list()
  {
    if( !$this->enabled ) return;
    $this->initialize();

    $this->call_list = array();
    $events = $this->manager->getStatus();

    if( is_null( $events ) )
      throw lib::create( 'exception\voip', $this->manager->getLastError(), __METHOD__ );

    foreach( $events as $s8_event )
      if( 'Status' == $s8_event->get( 'event' ) )
        $this->call_list[] = lib::create( 'business\voip_call', $s8_event, $this->manager );
  }

  /**
   * Returns an array of all SIP calls
   * 
   * @return array
   * @access public
   */
  public function get_call_list()
  {
    return is_array( $this->call_list ) ?
      array_filter(
        $this->call_list,
        function( $voip_call ) { return 'SIP' == substr( $voip_call->get_channel(), 0, 3 ); }
      ) :
      array();
  }

  /**
   * Gets a user's active call.  If the user isn't currently on a call then null is returned.
   * 
   * @param database\user or integer $user Which user's call to retrieve.
   *        If this parameter is null then the current user's call is returned.
   * @return voip_call
   * @access public
   */
  public function get_call( $user = NULL )
  {
    if( !$this->enabled ) return NULL;
    $this->initialize();

    if( is_null( $this->call_list ) ) $this->rebuild_call_list();

    $peer = static::get_peer_from_user( $user );

    // build the call list
    $calls = array();
    foreach( $this->call_list as $voip_call )
      if( $peer == $voip_call->get_peer() ) return $voip_call;

    return NULL;
  }

  /**
   * Attempts to connect to a phone.
   * 
   * @param mixed $phone May be a database phone record or an explicit number
   * @return voip_call
   * @access public
   * @throws exception\argument, exception\runtime, exception\notice, exception\voip
   */
  public function call( $phone )
  {
    if( !$this->enabled ) return NULL;
    $this->initialize();

    // validate the input
    if( !is_object( $phone ) )
    {
      $number = $phone;
    }
    else
    {
      $db_phone = $phone;
      if( !is_object( $db_phone ) )
        throw lib::create( 'exception\argument', 'db_phone', $db_phone, __METHOD__ );

      if( $db_phone->international )
        throw lib::create( 'exception\runtime', 'Tried to call an international phone number', __METHOD__ );

      $number = $db_phone->number;
    }

    // check that the phone number has exactly 10 digits
    $digits = preg_replace( '/[^0-9]/', '', $number );
    if( 10 != strlen( $digits ) )
      throw lib::create( 'exception\runtime',
        'Tried to connect to phone number which does not have exactly 10 digits.', __METHOD__ );

    // make sure the user isn't already in a call
    if( !is_null( $this->get_call() ) )
      throw lib::create( 'exception\notice',
        'Unable to connect call since you already appear to be in a call.', __METHOD__ );

    // originate call (careful, the online API has the arguments in the wrong order)
    $peer = static::get_peer_from_user();
    $channel = 'SIP/'.$peer;
    $context = 'from-internal';
    $extension = $this->prefix.$digits;
    $priority = 1;
    if( !$this->manager->originate( $channel, $context, $extension, $priority ) )
      throw lib::create( 'exception\voip', $this->manager->getLastError(), __METHOD__ );

    // rebuild the call list and return (what should be) the peer's only call
    $this->rebuild_call_list();
    return $this->get_call();
  }

  /**
   * Opens a listen-only connection to an existing call
   * 
   * @param voip_call $voip_call The call to spy on
   * @access public
   */
  public function spy( $voip_call )
  {
    if( !$this->enabled ) return;
    $this->initialize();

    $peer = static::get_peer_from_user();
    $channel = 'SIP/'.$peer;
    // play sound in local channel
    if( !$this->manager->originate(
      $channel,        // channel
      'cenozo',        // context
      'chanspy',       // extension
      1,               // priority
      false,           // application
      false,           // data
      30000,           // timeout
      false,           // callerID
      'ActionID=Spy,'. // variables
      'ToChannel='.$voip_call->get_channel() ) )
    {
      throw lib::create( 'exception\voip', $this->manager->getLastError(), __METHOD__ );
    }

    // rebuild the call list and return (what should be) the peer's only call
    $this->rebuild_call_list();
    return $this->get_call();
  }

  /**
   * Whether VOIP is enabled.
   * 
   * @return boolean
   * @access public
   */
  public function get_enabled() { return $this->enabled; }

  /**
   * Gets the dialing prefix to use when placing external calls
   * 
   * @return string
   * @access public
   */
  public function get_prefix() { return $this->prefix; }

  /**
   * Gets the "peer" from a user record
   * 
   * @param database\user $user Use NULL for the current session's user
   * @return integer
   * @access public
   * @static
   */
  public static function get_peer_from_user( $user = NULL )
  {
    if( is_null( $user ) ) $user = lib::create( 'business\session' )->get_user();

    // convert to a database ID if an object is provided
    if( !is_null( $user ) && is_a( $user, lib::get_class_name( 'database\user' ) ) ) $user = $user->id;
    return 10000000 + $user;
  }

  /**
   * Gets the user record from the "peer"
   * 
   * @param integer $peer
   * @return database\user
   * @access public
   * @static
   */
  public static function get_user_from_peer( $peer )
  {
    $util_class_name = lib::get_class_name( 'util' );
    return $util_class_name::string_matches_int( $peer ) ? $peer - 10000000 : NULL;
  }

  /**
   * The asterisk manager object
   * @var Shift8 object
   * @access private
   */
  private $manager = NULL;

  /**
   * An array of all currently active calls.
   * 
   * @var array( voip_call )
   * @access private
   */
  private $call_list = NULL;

  /**
   * Whether VOIP is enabled.
   * @var string
   * @access private
   */
  private $enabled = false;

  /**
   * The url that asterisk's AJAM is running on
   * @var string
   * @access private
   */
  private $url = '';

  /**
   * Which username to use when connecting to the manager
   * @var string
   * @access private
   */
  private $username = '';

  /**
   * Which password to use when connecting to the manager
   * @var string
   * @access private
   */
  private $password = '';

  /**
   * The dialing prefix to use when making external calls.
   * @var string
   * @access private
   */
  private $prefix = '';
}
