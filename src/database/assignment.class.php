<?php
/**
 * assignment.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * assignment: record
 */
class assignment extends \cenozo\database\record
{
  /**
   * Override parent method if identifier is 0 (get record from session)
   */
  public static function get_record_from_identifier( $identifier )
  {
    // session objects can be loaded by using the identifier 0
    return 0 === $identifier || '0' === $identifier ?
      lib::create( 'business\session' )->get_user()->get_open_assignment() :
      parent::get_record_from_identifier( $identifier );
  }

  /**
   * Overrides the parent save method.
   */
  public function save()
  {
    if( !is_null( $this->interview_id ) && is_null( $this->end_datetime ) )
    {
      // make sure there is a maximum of 1 unfinished assignment per user and interview
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'interview_id', '=', $this->interview_id );
      $modifier->where( 'end_datetime', '=', NULL );
      $modifier->where( 'id', '!=', $this->id );
      if( 0 < static::count( $modifier ) )
        throw lib::create( 'exception\runtime',
          'Cannot have more than one active assignment per interview.', __METHOD__ );

      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'user_id', '=', $this->user_id );
      $modifier->where( 'end_datetime', '=', NULL );
      $modifier->where( 'id', '!=', $this->id );
      if( 0 < static::count( $modifier ) )
        throw lib::create( 'exception\runtime',
          'Cannot have more than one active assignment per user.', __METHOD__ );
    }

    parent::save();
  }

  /**
   * Determines whether this assignment has an open phone call
   * 
   * @return boolean
   * @access public
   */
  function has_open_phone_call()
  {
    // check the primary key value
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to determine if assignment with no primary key has an open phone_call.' );
      return NULL;
    }

    $phone_call_mod = lib::create( 'database\modifier' );
    $phone_call_mod->where( 'phone_call.end_datetime', '=', NULL );
    return 0 < $this->get_phone_call_count( $phone_call_mod );
  }

  /**
   * Returns this assignment's open phone call, or NULL if it has no open phone calls
   * 
   * @return database\phone_call
   * @access public
   */
  function get_open_phone_call()
  {
    // check the primary key value
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to get open phone_call from assignment with no primary key.' );
      return NULL;
    }

    $phone_call_mod = lib::create( 'database\modifier' );
    $phone_call_mod->where( 'phone_call.end_datetime', '=', NULL );
    $phone_call_mod->order_desc( 'phone_call.start_datetime' );
    $phone_call_list = $this->get_phone_call_object_list( $phone_call_mod );
    if( 1 < count( $phone_call_list ) )
      log::warning( sprintf( 'User %d (%s) has more than one open phone_call!', $this->id, $this->name ) );
    return 0 < count( $phone_call_list ) ? current( $phone_call_list ) : NULL;
  }

  /**
   * Processes changes callbacks based on this assignment
   * 
   * @param boolean $completed Whether the assignment is being closed
   * @access public
   */
  function post_process( $completed )
  {
    $util_class_name = lib::get_class_name( 'util' );

    $db_participant = $this->get_interview()->get_participant();

    // delete the participant's callback if it has passed
    if( !is_null( $db_participant->callback ) &&
        $db_participant->callback < $util_class_name::get_datetime_object() )
    {
      $db_participant->callback = NULL;
      $db_participant->save();
    }
  }
}
