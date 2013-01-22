<?php
/**
 * main.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui;
use cenozo\lib, cenozo\log;

/**
 * Class that manages variables in main user interface template.
 */
class main extends \cenozo\base_object
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public static function get_variables()
  {
    $util_class_name = lib::get_class_name( 'util' );
    $session = lib::create( 'business\session' );
    $ldap_manager = lib::create( 'business\ldap_manager' );
    $setting_manager = lib::create( 'business\setting_manager' );

    $variables = array();
    $variables['jquery_ui_css_path'] =
      sprintf( '/%s/jquery-ui-%s.custom.css',
               $session->get_theme(),
               $setting_manager->get_setting( 'version', 'JQUERY_UI' ) );
    $variables['reset_password'] =
      $util_class_name::validate_user( $session->get_user()->name, 'password' );
    $variables['show_status'] = true;
    $variables['show_shortcuts'] = true;
    $variables['show_settings'] = true;
    $variables['show_menu'] = true;

    $jquery_libraries = array();
    foreach( $setting_manager->get_setting_category( 'url' ) as $library_name => $library_path )
      if( preg_match( '/^JQUERY(_[A-Z_]+)?_JS/', $library_name ) )
        $jquery_libraries[] = $library_path;
    $variables['jquery_libraries'] = $jquery_libraries;

    return $variables;
  }
}
?>
