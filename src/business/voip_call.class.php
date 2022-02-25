<?php
/**
 * voip_call.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\business;
use cenozo\lib, cenozo\log;

/**
 * The details of a voip call.
 */
class voip_call extends \cenozo\base_object
{
  /**
   * Constructor.
   * 
   * @param array $call_object The call object returned by the asterisk server's Status call
   * @param array $bridge_object The bridge object returned by the asterisk server's Status call
   * @access public
   */
  public function __construct( $call_object, $bridge_object )
  {
    $setting_manager = lib::create( 'business\setting_manager' );
    if( !$setting_manager->get_setting( 'module', 'voip' ) )
    {
      throw lib::create( 'exception\runtime',
        'Tried to create a voip-call but the voip module is not enabled.',
        __METHOD__ );
    }

    $this->channel = $call_object['Channel'];
    $this->bridge = $bridge_object['Channel'];
    $this->state = $call_object['ChannelStateDesc'];
    $this->number = $call_object['EffectiveConnectedLineNum'];
    $this->time = $call_object['Seconds'];

    // get the peer from the channel which is in the form: PJSIP/<peer>-HHHHHHHH
    // (where <peer> is the peer (without < and >) and H is a hexidecimal number)
    $matches = array();
    $this->peer = preg_match( '#SIP/([0-9]+)-[0-9]+#', $this->channel, $matches ) ? $matches[1] : 'unknown';
  }

  /**
   * Play a DTMF tone (ie: dial a number)
   * 
   * @param string $dtmf Which tone to play (one of 0123456789abcdgs)
   * @throws exception\voip
   * @access public
   */
  public function dtmf( $dtmf )
  {
    $voip_manager = lib::create( 'business\voip_manager' );
    if( !$voip_manager->get_enabled() ) return;

    // make sure the tone is valid
    if( !preg_match( '/^[0-9a-dgs]$/', $dtmf ) )
    {
      log::warning( 'Attempting to play an invalid DTMF tone.' );
      return;
    }


    // play the dtmf sound locally as audible feedback
    $this->play_sound( 'custom/dtmf'.$dtmf, 0, false );

    // convert g to # and s to * before sending to asterisk
    if( 'g' == $dtmf ) $dtmf = '#';
    else if( 's' == $dtmf ) $dtmf = '*';

    // now send the DTMF tone itself (which is not heard locally)
    $voip_manager->play_dtmf( $this->bridge, $dtmf );
  }

  /**
   * Disconnects a call (does nothing if already disconnected).
   * 
   * @access public
   */
  public function hang_up()
  {
    $voip_manager = lib::create( 'business\voip_manager' );
    if( !$voip_manager->get_enabled() ) return;

    // hang up the call, if successful then rebuild the call list
    $voip_manager->hang_up( $this->channel );
    $voip_manager->rebuild_call_list();
  }

  /**
   * Plays a sound file located in asterisk's sound directory.
   * 
   * @param string $sound The name of the sound file to play, without file extension.  For custom
   *               sounds (those that are not included with asterisk) make sure to specify the
   *               custom directory, ie: custom/dtmf0
   * @param int $volume The volume to play the sound at.  This is an integer which ranges from -4
   *            to 4, where 0 is the "regular" volume.
   * @param boolean $bridge Whether to play the sound so that both sides of the connection can hear
   *                it.  If this is false then only the caller will hear the sound.
   * @access public
   */
  public function play_sound( $sound, $volume = 0, $bridge = true )
  {
    $voip_manager = lib::create( 'business\voip_manager' );
    if( !$voip_manager->get_enabled() ) return;

    // constrain the volume to be between -4 and 4
    $volume = intval( $volume );
    if( -4 > $volume ) $volume = -4;
    else if( 4 < $volume ) $volume = 4;

    // play sound in local channel
    $voip_manager->play_sound( $this->channel, $sound, $volume );
    if( $bridge ) $voip_manager->play_sound( $this->bridge, $sound, $volume );
  }

  /**
   * Starts recording (monitoring) the call.
   * 
   * @param string $filename The file name the recorded call is to be saved under.
   * @access public
   */
  public function start_recording( $filename )
  {
    $voip_manager = lib::create( 'business\voip_manager' );
    if( !$voip_manager->get_enabled() ) return;

    $setting_manager = lib::create( 'business\setting_manager' );
    if( !$setting_manager->get_setting( 'module', 'recording' ) )
    {
      log::warning( 'Called start_recording but recording module is not installed.' );
      return;
    }
    else if( !lib::create( 'business\voip_manager' )->get_enabled() ) return;

    $filename = sprintf( '%s/%s', $setting_manager->get_setting( 'voip', 'monitor' ), $filename );
    $voip_manager->start_recording( $this->channel, $filename, 'wav' );
  }

  /**
   * Stops recording (monitoring) the call.
   * 
   * @access public
   */
  public function stop_recording()
  {
    $voip_manager = lib::create( 'business\voip_manager' );
    if( !$voip_manager->get_enabled() ) return;

    $setting_manager = lib::create( 'business\setting_manager' );
    if( !$setting_manager->get_setting( 'module', 'recording' ) )
    {
      log::warning( 'Called stop_recording but recording module is not installed.' );
      return;
    }
    else if( !lib::create( 'business\voip_manager' )->get_enabled() ) return;

    $voip_manager->stop_recording( $this->channel );
  }

  /**
   * TODO: document
   */
  public function spy()
  {
    $voip_manager = lib::create( 'business\voip_manager' );
    if( !$voip_manager->get_enabled() ) return;
    $voip_manager->spy( $this->channel );
  }

  /**
   * Get the call's peer
   * @return string
   * @access public
   */
  public function get_peer() { return $this->peer; }

  /**
   * Get the call's user
   * @return integer
   * @access public
   */
  public function get_user()
  {
    $voip_manager_class_name = lib::get_class_name( 'business\voip_manager' );
    return $voip_manager_class_name::get_user_from_peer( $this->peer );
  }

  /**
   * Get the call's channel
   * @return string
   * @access public
   */
  public function get_channel() { return $this->channel; }

  /**
   * Get the call's bridged channel
   * @return string
   * @access public
   */
  public function get_bridge() { return $this->bridge; }

  /**
   * Get the call's state (Up, Ring, etc)
   * @return string
   * @access public
   */
  public function get_state() { return $this->state; }

  /**
   * Get the number called (the extension without dialing prefix)
   * @return string
   * @access public
   */
  public function get_number() { return $this->number; }

  /**
   * Get the call's time in seconds
   * @return int
   * @access public
   */
  public function get_time() { return $this->time; }

  /**
   * The call's peer (should match system user name)
   * 
   * @var string
   * @access private
   */
  private $peer;

  /**
   * The call's channel.
   * 
   * @var string
   * @access private
   */
  private $channel = NULL;

  /**
   * The call's bridged channel.
   * 
   * @var string
   * @access private
   */
  private $bridge = NULL;

  /**
   * The state of the call (Up, Ring, etc)
   * 
   * @var string
   * @access private
   */
  private $state = NULL;

  /**
   * The number called (the extension without dialing prefix)
   * 
   * @var string
   * @access private
   */
  private $number = NULL;

  /**
   * The length of the call in seconds.
   * 
   * @var int
   * @access private
   */
  private $time = NULL;
}
