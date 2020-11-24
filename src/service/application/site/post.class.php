<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\application\site;
use cenozo\lib, cenozo\log;

/**
 * The base class of all post services.
 */
class post extends \cenozo\service\post
{
  /**
   * Extends parent method
   */
  protected function execute()
  {
    $setting_class_name = lib::get_class_name( 'database\setting' );

    parent::execute();

    $post_object = $this->get_file_as_object();
    if( property_exists( $post_object, 'add' ) )
    {
      // create a setting record for the new site
      foreach( $post_object->add as $site_id )
      {
        $db_setting = $setting_class_name::get_unique_record( 'site_id', $site_id );
        if( is_null( $db_setting ) )
        {
          $db_setting = lib::create( 'database\setting' );
          $db_setting->site_id = $site_id;
          $db_setting->save();
        }
      }
    }
    else if( property_exists( $post_object, 'remove' ) )
    {
      // remove site settings
      foreach( $post_object->remove as $site_id )
      {
        $db_setting = $setting_class_name::get_unique_record( 'site_id', $site_id );
        if( !is_null( $db_setting ) ) $db_setting->delete();
      }
    }
  }
}
