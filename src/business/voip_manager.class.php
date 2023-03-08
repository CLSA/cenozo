<?php
/**
 * voip_manager.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\business;
use cenozo\lib, cenozo\log;

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
    $this->domain = $setting_manager->get_setting( 'voip', 'domain' );
    $this->ami_port = $setting_manager->get_setting( 'voip', 'ami_port' );
    $this->username = $setting_manager->get_setting( 'voip', 'username' );
    $this->password = $setting_manager->get_setting( 'voip', 'password' );
    $this->prefix = $setting_manager->get_setting( 'voip', 'prefix' );
  }

  /**
   * Tests to see if the AMI connection is available
   * @return boolean
   * @access public
   */
  public function test_connection()
  {
    if( !$this->enabled ) return false;

    $success = true;
    try { $this->command( [ 'action' => 'Status' ] ); }
    catch( \Exception $e ) { $success = false; }

    return $success;
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

    // get the current SIP info
    $peer = static::get_peer_from_user( $user );

    $sip_info = NULL;
    foreach( $this->command( [ 'action' => 'PJSIPShowEndpoint', 'endpoint' => $peer ] ) as $object )
    {
      if( array_key_exists( 'Event', $object ) && 'ContactStatusDetail' == $object['Event'] )
      {
        $peer = $object['EndpointName'];
        $sip_info = array(
          'peer' => $peer,
          'status' => $object['Status'],
          'agent' => $object['UserAgent'],
          'uri' => $object['URI']
        );
        break;
      }
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

    $util_class_name = lib::get_class_name( 'util' );
    $sip_info_list = array();
    foreach( $this->command( [ 'action' => 'PJSIPShowEndpoints' ] ) as $object )
    {
      if( array_key_exists( 'Event', $object ) && 'EndpointList' == $object['Event'] &&
          array_key_exists( 'DeviceState', $object ) && 'Unavailable' != $object['DeviceState'] )
      {
        $peer = $object['ObjectName'];
        $sip_info_list[] = array(
          'peer' => $peer,
          'user_id' => $util_class_name::string_matches_int( $peer ) ? $peer - 10000000 : NULL,
          'status' => $object['DeviceState']
        );
      }
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

    $paired_list = array();
    foreach( $this->command( [ 'action' => 'Status' ] ) as $object )
    {
      // go through the status events matching channels with bridged channels and create call objects
      if( array_key_exists( 'Event', $object ) && 'Status' == $object['Event'] )
      {
        $id = NULL;
        $bridge = false;

        // check for internal ringing/down events
        if( 'from-internal' == $object['Context'] &&
            array_key_exists( 'ChannelStateDesc', $object ) &&
            in_array( $object['ChannelStateDesc'], ['Down', 'Ringing'] ) )
        {
          // For internal ring events the CallerIDNum will be the user's peer
          $id = $object['CallerIDNum'];
        }
        else
        {
          // the bridge context (participant) will always have "from-trunk-" in the context
          $bridge = 'from-trunk-' == substr( $object['Context'], 0, 11 );

          // the remote number will depend on if this is the bridge or not
          $number = $bridge ? $object['CallerIDNum'] : $object['ConnectedLineNum'];
          if( '1' == $number[0] ) $number = substr( $number, 1 ); // remove the leading 1, if it exists

          // if we don't have a bridge ID then use the number to identify the caller/callee
          $id = $object['BridgeID'] ? $object['BridgeID'] : $number;
        }

        if( '<unknown>' != $id )
        {
          if( !array_key_exists( $id, $paired_list ) )
            $paired_list[$id] = array( 'call' => NULL, 'bridge' => NULL );
          $paired_list[$id][$bridge ? 'bridge' : 'call'] = $object;
        }
      }
    }

    $this->call_list = array();
    foreach( $paired_list as $pair )
    {
      $this->call_list[] = lib::create( 'business\voip_call', $pair['call'], $pair['bridge'] );
    }
  }

  /**
   * Gets a user's active call.  If the user isn't currently on a call then null is returned.
   * 
   * @param database\user or integer $user Which user's call to retrieve (default is the current user)
   * @return voip_call
   * @access public
   */
  public function get_call( $user = NULL )
  {
    if( !$this->enabled ) return NULL;

    if( is_null( $this->call_list ) ) $this->rebuild_call_list();
    $peer = static::get_peer_from_user( $user );

    // search the call list for the requested user
    foreach( $this->call_list as $voip_call ) if( $peer == $voip_call->get_peer() ) return $voip_call;
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
    $this->command( [
      'action' => 'Originate',
      'Channel' => 'PJSIP/'.$peer,
      'Context' => 'from-internal',
      'Exten' => sprintf( '%s%s', $this->prefix, $digits ),
      'Priority' => 1,
      'Timeout' => 30000,
      'Async' => 'true'
    ] );

    // rebuild the call list and return (what should be) the peer's only call
    sleep( 1 ); // wait for the call to register in Asterisk before rebuilding the call list
    $this->rebuild_call_list();
    $call = $this->get_call();
    if( is_null( $call ) )
    {
      log::error( sprintf(
        "No call found after %s placed call to %s.",
        lib::create( 'business\session' )->get_user()->name,
        $number
      ) );
    }

    return $call;
  }

  /** 
   * Hangs up the call for the given channel
   * 
   * @param string $channel The channel (usually from a voip_call object)
   * @access public
   */
  public function hang_up( $channel )
  {
    if( !$this->enabled ) return;
    $this->command( [
      'action' => 'Hangup',
      'Channel' => $channel
    ] );
  }

  /**
   * Plays a sound in the given channel
   * 
   * @param string $channel The channel (usually from a voip_call object)
   * @param string $filename The filename of the sound to play (on the Asterisk server)
   * @param integer $volume A gain value between -4 and +4 (default 0)
   * @access public
   */
  public function play_sound( $channel, $filename, $volume = 0 )
  {
    if( !$this->enabled ) return;
    $this->command( [
      'action' => 'Originate',
      'Channel' => 'Local/playback@cenozo',
      'Context' => 'cenozo',
      'Exten' => 'playbackspy',
      'Priority' => 1,
      'Timeout' => 30000,
      'Async' => 'true',
      'Variable' => sprintf( 'ActionID=PlayBack,Sound=%s,Volume=%s,ToChannel=%s', $filename, $volume, $channel )
    ] );
  }

  /**
   * Plays a DTMF tone to the given channel
   * 
   * @param string $channel The channel (usually from a voip_call object)
   * @param string $dtmf The tone to play [0-9aabcdgs]
   * @access public
   */
  public function play_dtmf( $channel, $dtmf )
  {
    if( !$this->enabled ) return;
    $this->command( [
      'action' => 'PlayDTMF',
      'Channel' => $channel,
      'Digit' => $dtmf
    ] );
  }

  /**
   * Starts recording the channel
   * 
   * @param string $channel The channel (usually from a voip_call object)
   * @param string $filename The name fo the destination file to be stored on the asterisk server
   * @param string $format The type of file to write (default is wav)
   * @access public
   */
  public function start_recording( $channel, $filename, $format = 'wav' )
  {
    if( !$this->enabled ) return;
    $this->command( [
      'action' => 'Monitor',
      'Channel' => $channel,
      'File' => $filename,
      'Format' => $format
    ] );
  }

  /**
   * Stops recording the channel
   * 
   * @param string $channel The channel (usually from a voip_call object)
   * @access public
   */
  public function stop_recording( $channel )
  {
    if( !$this->enabled ) return;
    $this->command( [
      'action' => 'StopMonitor',
      'Channel' => $channel
    ] );
  }

  /**
   * Opens a listen-only connection to an existing call
   * 
   * @param string $channel The channel (usually from a voip_call object)
   * @access public
   */
  public function spy( $channel )
  {
    if( !$this->enabled ) return;

    $peer = static::get_peer_from_user();
    $this->command( [
      'action' => 'Originate',
      'Channel' => 'PJSIP/'.$peer,
      'Context' => 'cenozo',
      'Exten' => 'chanspy',
      'Priority' => 1,
      'Timeout' => 30000,
      'Async' => 'true',
      'Variable' => sprintf( 'ActionID=Spy,ToChannel=%s', $channel )
    ] );

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
    $user_id = $util_class_name::string_matches_int( $peer ) ? $peer - 10000000 : NULL;
    return is_null( $user_id ) ? NULL : lib::create( 'database\user', $user_id );
  }

  /**
   * Sends a command to the asterisk server
   * 
   * @param array $command A list of parameters that make up the command
   * @return array( array) An array of associative arrays with all of the server's response to the command
   * @access protected
   */
  protected function command( $command )
  {
    // open a socket to the server
    $socket = fsockopen( $this->domain, $this->ami_port, $error_code, $error_message, 5 );
    if( !$socket ) throw lib::create( 'exception\voip', $error_message, __METHOD__ );

    // login, send the command, then logout
    $this->send( $socket, [ 'action' => 'login', 'username' => $this->username, 'secret' => $this->password ] );
    $this->send( $socket, $command );
    $this->send( $socket, [ 'action' => 'logoff' ] );

    // now read and return the server's response
    $output = '';
    while( !feof( $socket ) ) $output .= fread( $socket, 8192 );
    fclose( $socket );

    $data = array();
    $item = array();
    foreach( explode( "\r\n", $output ) as $line )
    {
      if( 0 == strlen( $line ) ) 
      {  
        if( 0 < count( $item ) ) 
        {   
          $data[] = $item;
          $item = array();
        }   
      }   
      else if( preg_match( '/([^:]+): (.*)/', $line, $matches ) ) 
      {   
        $item[$matches[1]] = $matches[2];
      }  
    }

    return $data;
  }

  /**
   * Sends an operation to the server (only to be used by the command() method)
   * 
   * @param resource $socket An open socket connection to the Asterisk server
   * @param array $command An associative array of command parameters to send
   */
  private function send( $socket, $command )
  {
    // build and send the message to the server
    $message = '';
    foreach( $command as $key => $value ) $message .= sprintf( "%s: %s\r\n", $key, $value );
    $message .= "\r\n";
    fputs( $socket, $message );
  }

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
   * The domain of the Asterisk server
   * @var string
   * @access private
   */
  private $domain = 'localhost';

  /**
   * The port that asterisk's AMI interface is running on
   * @var integer
   * @access private
   */
  private $ami_port = 5038;

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
