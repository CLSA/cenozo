<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\alternate_consent_type\role;
use cenozo\lib, cenozo\log;

class post extends \cenozo\service\post
{
  /**
   * Replace parent method
   */
  protected function validate()
  {
    parent::validate();

    if( 300 > $this->status->get_code() )
    {
      // make sure that only administrators can change which roles have access to an alternate_consent_type
      $post_object = $this->get_file_as_object();
      if( is_object( $post_object ) )
      {
        if( 3 > lib::create( 'business\session' )->get_role()->tier ) $this->status->set_code( 403 );
      }
    }    
  }
}
