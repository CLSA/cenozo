<?php
/**
 * setting_manager.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\business;
use cenozo\lib, cenozo\log;

/**
 * Manages software settings
 */
class setting_manager extends \cenozo\singleton
{
  /**
   * Constructor.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\argument
   * @access protected
   */
  protected function __construct( $arguments )
  {
    $static_settings = $arguments[0];

    // copy the setting one category at a time, ignore any unknown categories
    $categories = array( 'db',
                         'general',
                         'interface',
                         'ldap',
                         'path',
                         'url',
                         'version' );

    foreach( $categories as $category )
    {
      // make sure the category exists
      if( !array_key_exists( $category, $static_settings ) )
      {
        throw lib::create( 'exception\argument',
          'static_settings['.$category.']', NULL, __METHOD__ );
      }
      $this->static_settings[$category] = $static_settings[$category];
    }
  }

  /**
   * Get a setting's value
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $category The category the setting belongs to.
   * @param string $name The name of the setting.
   * @param database\site $db_site Force a site other than the user's current site.
   * @access public
   */
  public function get_setting( $category, $name, $db_site = NULL )
  {
    // first check for the setting in static settings
    if( array_key_exists( $category, $this->static_settings ) &&
        array_key_exists( $name, $this->static_settings[$category] ) )
    {
      return $this->static_settings[$category][$name];
    }

    if( is_null( $db_site ) ) $db_site = lib::create( 'business\session' )->get_site();

    // now check in dynamic settings 
    if( array_key_exists( $category, $this->dynamic_settings ) &&
        array_key_exists( $name, $this->dynamic_settings[$category] ) &&
        array_key_exists( $db_site->id, $this->dynamic_settings[$category][$name] ) )
    {
      return $this->dynamic_settings[$category][$name][$db_site->id];
    }
    else // check if the setting exists in the database
    {
      $setting_class_name = lib::get_class_name( 'database\setting' );
      $db_setting = $setting_class_name::get_setting( $category, $name );
      if( !is_null( $db_setting ) )
      {
        $modifier = lib::create( 'database\modifier' );
        $modifier->where( 'site_id', '=', $db_site->id );
        $setting_value_list = $db_setting->get_setting_value_list( $modifier );
        
        $string_value = count( $setting_value_list )
                      ? $setting_value_list[0]->value
                      : $db_setting->value;
        if( 'boolean' == $db_setting->type ) $value = "true" == $string_value;
        else if( 'integer' == $db_setting->type ) $value = intval( $string_value );
        else if( 'float' == $db_setting->type ) $value = floatval( $string_value );
        else $value = $string_value;

        // store the value in case we need it again
        $this->dynamic_settings[$category][$name][$db_site->id] = $value;
        return $value;
      }
    }
    
    // if we get here then the setting doesn't exist
    log::err( "Tried getting value for setting [$category][$name] which doesn't exist." );
    
    return NULL;
  }

  /**
   * Get all settings in a category.
   * Note, this only works with static settings.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $category The category the setting belongs to.
   * @access public
   */
  public function get_setting_category( $category )
  {
    return array_key_exists( $category, $this->static_settings )
         ? $this->static_settings[$category]
         : array();
  }

  /**
   * An array which holds static (non database) settings
   * @var array( mixed )
   * @access private
   */
  protected $static_settings = array();

  /**
   * An array which holds dynamic (database) settings
   * @var array( mixed )
   * @access private
   */
  protected $dynamic_settings = array();
}
