<?php
/**
 * delete.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\system_message\user;
use cenozo\lib, cenozo\log;

/**
 * The base class of all delete services.
 */
class delete extends \cenozo\service\delete
{
  /**
   * Extends parent method
   */
  protected function validate()
  {
    parent::validate();

    $db_user = $this->get_resource( 1 );
    $self = $db_user->id == lib::create( 'business\session' )->get_user()->id;

    if( 300 >= $this->status->get_code() )
    {
      // don't allow users to mark other user's messages as unread
      if( !$self ) $this->status->set_code( 403 );
    }
    else if( 403 == $this->status->get_code() )
    {
      // allow anyone to makr their own system messages as unread
      if( $self ) $this->status->set_code( 200 );
    }
  }
}
