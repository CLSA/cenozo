<?php
/**
 * initial.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\business
 */

namespace cenozo;
use cenozo\lib, cenozo\log;

/**
 * This class reads and organizes settings from the framework and application ini files
 */
final class initial
{
  /**
   * Constructor
   * @access public
   */
  public function __construct( $scripting = false )
  {
    // include the initialization settings
    global $SETTINGS;
    $this->add_settings( $SETTINGS, true );
    unset( $SETTINGS );

    // include the framework's initialization settings
    $base_path = $this->settings['path']['CENOZO'];
    require_once( $base_path.'/settings.local.ini.php' );
    $this->add_settings( $settings );
    require_once( $base_path.'/settings.ini.php' );
    $this->add_settings( $settings );

    if( !array_key_exists( 'general', $this->settings ) ||
        !array_key_exists( 'application_name', $this->settings['general'] ) )
      die( 'Error, application name not set!' );

    // make sure all paths are valid
    if( !$scripting )
    {
      foreach( $this->settings['path'] as $key => $path )
      {
        if( 'TEMP' == $key )
        { // create the temp directory if it doesn't already exist
          if( !is_dir( $path ) ) mkdir( $path, 0777, true );
        }
        else if( false !== strpos( $path, $this->settings['path']['TEMP'] ) )
        { // create paths which are in the temp directory
          if( !is_dir( $path ) ) mkdir( $path, 0777, true );
        }
        else if( 'COOKIE' != $key &&
                 'TEMPLATE_CACHE' != $key &&
                 !( is_null( $path ) || is_file( $path ) || is_link( $path ) || is_dir( $path ) ) )
        {
          die( sprintf( 'Error, path for %s (%s) is invalid!', $key, $path ) );
        }
        else if( 'REPORT' == $key && !is_writable( $path ) )
        {
          die( sprintf( 'Error, report path, %s, is not writable!', $path ) );
        }
      }
    }

    define( 'DEVELOPMENT', $this->settings['general']['development_mode'] );
    define( 'CENOZO_BUILD', $this->settings['general']['cenozo_build'] );
    define( 'APP_BUILD', $this->settings['general']['build'] );
    define( 'APPLICATION', $this->settings['general']['application_name'] );
    define( 'INSTANCE', $this->settings['general']['instance_name'] );
    $this->settings['path']['CENOZO_SRC'] = $this->settings['path']['CENOZO'].'/src';
    $this->settings['path']['APP_SRC'] = $this->settings['path']['APPLICATION'].'/src';
    $this->settings['path']['WEB'] = $this->settings['path']['CENOZO'].'/web';

    foreach( $this->settings['path'] as $path_name => $path_value ) define( $path_name.'_PATH', $path_value );
    foreach( $this->settings['url'] as $path_name => $path_value ) define( $path_name.'_URL', $path_value );
  }

  /**
   * Provides an associative array of all framework and application settings
   * 
   * @return associative array
   * @access public
   */
  public function get_settings() { return $this->settings; }

  /**
   * Adds a list of key/value pairs to the settings
   * 
   * @param array $settings
   * @param boolean $replace Whether to replace the existing settings array
   * @access private
   */
  private function add_settings( $settings, $replace = false )
  {
    if( $replace )
    {
      $this->settings = $settings;
    }
    else
    {
      foreach( $settings as $category => $setting )
      {
        if( !array_key_exists( $category, $this->settings ) )
        {
          $this->settings[$category] = $setting;
        }
        else
        {
          foreach( $setting as $key => $value )
            if( !array_key_exists( $key, $this->settings[$category] ) )
              $this->settings[$category][$key] = $value;
        }
      }
    }
  }

  /**
   * Contains all initialization parameters.
   * @var array
   * @access private
   */
  private $settings = array();
}
