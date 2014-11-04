<?php
/**
 * participant_edit.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: participant edit
 *
 * Edit a participant.
 */
class participant_edit extends base_edit
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'participant', $args );
  }

  /**
   * Processes arguments, preparing them for the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function prepare()
  {
    parent::prepare();

    if( array_key_exists( 'columns', $this->arguments ) )
    {
      // trim the email column argument, if it exists
      if( array_key_exists( 'email', $this->arguments['columns'] ) )
        $this->arguments['columns']['email'] = trim( $this->arguments['columns']['email'] );

      // convert the "email_mass_messages" to "email_do_not_contact"
      if( array_key_exists( 'email_mass_messages', $this->arguments['columns'] ) )
      {
        $this->arguments['columns']['email_do_not_contact'] =
          $this->arguments['columns']['email_mass_messages'] ? 0 : 1;
        unset( $this->arguments['columns']['email_mass_messages'] );
      }
    }
  }

  /**
   * Validate the operation.  If validation fails this method will throw a notice exception.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function validate()
  {
    parent::validate();

    $util_class_name = lib::get_class_name( 'util' );
    $columns = $this->get_argument( 'columns', array() );

    // make sure role has access to state
    $db_role = lib::create( 'business\session' )->get_role();
    if( array_key_exists( 'state_id', $columns ) && $columns['state_id'] )
    {
      $db_state = lib::create( 'database\state', $columns['state_id'] );
      if( !lib::create( 'business\session' )->get_role()->has_state( $db_state ) )
      {
        throw lib::create( 'exception\notice',
          sprintf(
            'Your role is not permitted to use set a participant\'s condition to %s. '.
            'Please contact your superior for more information.',
            $db_state->name ),
          __METHOD__ );
      }
    }

    // do not allow double quotes or paretheses in first or last name
    if( ( array_key_exists( 'first_name', $columns ) &&
          preg_match( '/[,`"(){}\[\];:\/\\\]/', $columns['first_name'] ) ) ||
        ( array_key_exists( 'last_name', $columns ) &&
          preg_match( '/[,`"(){}\[\];:\/\\\]/', $columns['last_name'] ) ) )
    {
      throw lib::create( 'exception\notice',
        'First and last names cannot include commas (,), back ticks (`), double quotes ("), '.
        'colons (:), semicolons (;), slashes (/), backslashes (\\) or brackets.',
        __METHOD__ );
    }

    // only admins can change active state
    if( array_key_exists( 'active', $columns ) && 'administrator' != $db_role->name )
    {
      throw lib::create( 'exception\notice',
        'Only administrators are allowed to set a participant\'s active status.',
        __METHOD__ );
    }

    // only admins can change age_group
    if( array_key_exists( 'age_group_id', $columns ) && 'administrator' != $db_role->name )
    {
      throw lib::create( 'exception\notice',
        'Only administrators are allowed to set a participant\'s age group.',
        __METHOD__ );
    }

    // make sure the email address is valid
    if( array_key_exists( 'email', $columns ) &&
        0 < strlen( trim( $columns['email'] ) ) &&
        !$util_class_name::validate_email( $columns['email'] ) )
    {
      throw lib::create( 'exception\notice',
        'Email address is not in the correct format.  Please only include a single email '.
        'address in the form "account@domain.name"  For invalid addresses, or if you wish '.
        'to leave the field empty please leave the field empty.',
        __METHOD__ );
    }
  }

  /**
   * This method executes the operation's purpose.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function execute()
  {
    parent::execute();

    $service_class_name = lib::get_class_name( 'database\service' );
    $record = $this->get_record();
    $columns = $this->get_argument( 'columns', array() );
    
    // look for preferred site column(s)
    foreach( $service_class_name::select() as $db_service )
    {
      $column_name = $db_service->name.'_site_id';

      if( array_key_exists( $column_name, $columns ) )
      {
        $site_id = $columns[$column_name];
        $db_site = $site_id ? lib::create( 'database\site', $site_id ) : NULL;
        $record->set_preferred_site( $db_service, $db_site );
      }
    }

    // update hin (separate table)
    $edit_hin = false;
    foreach( array_keys( $columns ) as $column )
      if( 'hin_' == substr( $column, 0, 4 ) ) $edit_hin = true;

    if( $edit_hin )
    {
      $db_hin = $record->get_hin();
      if( is_null( $db_hin ) )
      { // create a new hin entry
        $db_hin = lib::create( 'database\hin' );
        $db_hin->participant_id = $record->id;
      }

      if( array_key_exists( 'hin_access', $columns ) )
        $db_hin->access = $columns['hin_access'];
      if( array_key_exists( 'hin_future_access', $columns ) )
        $db_hin->future_access = $columns['hin_future_access'];
      if( array_key_exists( 'hin_code', $columns ) )
        $db_hin->code = $columns['hin_code'];
      if( array_key_exists( 'hin_region_id', $columns ) )
        $db_hin->region_id = $columns['hin_region_id'];

      $db_hin->save();
    }
  }
}
