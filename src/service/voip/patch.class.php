<?php
/**
 * patch.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\voip;
use cenozo\lib, cenozo\log;

/**
 * Special service for handling the patch meta-resource (result)
 */
class patch extends \cenozo\service\service
{
  /**
   * Constructor
   * 
   * @param string $path The URL of the service (not including the base)
   * @param array $args An associative array of arguments to be processed by the patch operation.
   * @param string $file The raw file patched by the request
   * @access public
   */
  public function __construct( $path, $args, $file )
  {
    parent::__construct( 'PATCH', $path, $args, $file );
  }

  /**
   * Override parent method since voip is a meta-resource
   */
  protected function create_resource( $index )
  {
    $id = $this->get_resource_value( $index );
    return lib::create( 'business\voip_manager' )->get_call( $id ? $id : NULL );
  }

  /**
   * Override parent method since voip is a meta-resource
   */
  protected function validate()
  {
    parent::validate();

    // make sure the voip operation is valid
    $error_code = NULL;
    $data = $this->get_file_as_array();
    $operation = array_key_exists( 'operation', $data ) ? $data['operation'] : NULL;

    $setting_manager = lib::create( 'business\setting_manager' );
    if( !$setting_manager->get_setting( 'module', 'recording' ) &&
        in_array( $operation, array( 'play_sound', 'start_recording', 'stop_recording' ) ) )
    {
      log::warning( sprintf( 'Sending %s command to voip but recording module is not installed.', $operation ) );
      $error_code = 500;
    }
    else if( 'dtmf' == $operation )
    {
      // make sure we have a tone
      if( !array_key_exists( 'tone', $data ) ) $error_code = 412;
    }
    else if( 'play_sound' == $operation )
    {
      // make sure we have a recording_file or a filename
      if( !( array_key_exists( 'recording_file_id', $data ) ||
             array_key_exists( 'filename', $data ) ) ) $error_code = 412;
    }
    else if( 'start_recording' == $operation )
    {
      // make sure we have a recording or a filename
      if( !( array_key_exists( 'recording_id', $data ) ||
             array_key_exists( 'filename', $data ) ) ) $error_code = 412;
    }
    else if( 'stop_recording' == $operation )
    {
      // no other arguments required
    }
    else if( 'spy' == $operation )
    {
      // no other arguments required
    }
    else $error_code = 412;

    if( !is_null( $error_code ) ) $this->get_status()->set_code( $error_code );
  }

  /**
   * Override parent method since voip is a meta-resource
   */
  protected function execute()
  {
    $voip_call = $this->get_leaf_record();
    $object = $this->get_file_as_object();

    if( !is_null( $voip_call ) )
    {
      $data = $this->get_file_as_array();
      if( 'dtmf' == $data['operation'] )
      {
        $voip_call->dtmf( $data['tone'] );
      }
      else if( 'play_sound' == $data['operation'] )
      {
        $voip_call->play_sound(
          // sound file
          array_key_exists( 'recording_file_id', $data ) ?
            lib::create( 'database\recording_file', $data['recording_file_id'] )->filename :
            $data['filename'],
          // volume
          array_key_exists( 'volume', $data ) ? intval( $data['volume'] ) : 0
        );
      }
      else if( 'start_recording' == $data['operation'] )
      {
        $voip_call->start_recording( 
          // destination file
          array_key_exists( 'recording_id', $data ) ?
            lib::create( 'database\recording', $data['recording_id'] )->name :
            $data['filename']
        );
      }
      else if( 'stop_recording' == $data['operation'] )
      {
        $voip_call->stop_recording();
      }
      else if( 'spy' )
      {
        $voip_call->spy();
      }
    }

    $this->status->set_code( !is_null( $voip_call ) ? 200 : 404 );
  }
}
