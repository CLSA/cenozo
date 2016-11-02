<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\system_message\user;
use cenozo\lib, cenozo\log;

/**
 * The base class of all post services.
 */
class post extends \cenozo\service\post
{
  /**
   * Extends parent method
   */
  protected function validate()
  {
    parent::validate();

    $user_id = $this->get_file_as_raw();
    $self = $user_id == lib::create( 'business\session' )->get_user()->id;

    if( 300 > $this->status->get_code() )
    {
      // don't allow users to mark other user's messages as read
      if( !$self ) $this->status->set_code( 403 );
    }
    else if( 306 == $this->status->get_code() || 403 == $this->status->get_code() )
    {
      // allow anyone to makr their own system messages as read
      if( $self ) $this->status->set_code( 200 );
    }
  }
}
