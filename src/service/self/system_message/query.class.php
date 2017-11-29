<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\self\system_message;
use cenozo\lib, cenozo\log;

/**
 * Extends parent class
 */
class query extends \cenozo\service\query
{
  /**
   * Override parent method since self is a meta-resource
   */
  protected function create_resource( $index )
  {
    return 0 == $index ? lib::create( 'business\session' )->get_user() : parent::create_resource( $index );
  }

  /**
   * Extend parent method
   */
  protected function get_record_count()
  {
    $system_message_class_name = lib::get_class_name( 'database\system_message' );
    return $system_message_class_name::count( $this->get_custom_modifier() );
  }

  /**
   * Extend parent method
   */
  protected function get_record_list()
  {
    $system_message_class_name = lib::get_class_name( 'database\system_message' );
    return $system_message_class_name::select( $this->select, $this->get_custom_modifier() );
  }

  /**
   * Returns the custom modifier used by the get_record_count() and get_record_list() methods
   */
  private function get_custom_modifier()
  {
    $db_role = lib::create( 'business\session' )->get_role();
    $db_user = lib::create( 'business\session' )->get_user();

    $modifier = clone $this->modifier;

    // replace cross join to user_has_system_message with left join
    $modifier->remove_join( 'user_has_system_message' );
    $modifier->remove_join( 'user' );
    $modifier->remove_where( 'user.id' );
    $modifier->left_join(
      'user_has_system_message',
      'system_message.id',
      'user_has_system_message.system_message_id'
    );
    $modifier->left_join( 'user', 'user_has_system_message.user_id', 'user.id' );
    $modifier->where( sprintf( 'IFNULL( user.id, %s )', $db_user->id ), '=', $db_user->id );

    // restrict to messages for this role
    $modifier->where( sprintf( 'IFNULL( system_message.role_id, %s )', $db_role->id ), '=', $db_role->id );

    return $modifier;
  }
}
