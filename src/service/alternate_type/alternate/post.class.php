<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\alternate_type\alternate;
use cenozo\lib, cenozo\log;

class post extends \cenozo\service\post
{
  /**
   * Replace parent method
   */
  protected function validate()
  {
    parent::validate();

    if( $this->may_continue() )
    {
      // make sure that only administrators can change which alternates have an alternate_type role
      $post_object = $this->get_file_as_object();
      if( is_object( $post_object ) )
      {
        if( 3 > lib::create( 'business\session' )->get_role()->tier ) $this->status->set_code( 403 );
      }
    }    
  }
}
