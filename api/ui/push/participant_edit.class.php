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
   * Validate the operation.  If validation fails this method will throw a notice exception.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function validate()
  {
    parent::validate();

    // make sure role has access to state
    $db_role = lib::create( 'business\session' )->get_role();
    $columns = $this->get_argument( 'columns', array() );
    if( array_key_exists( 'state_id', $columns ) )
    {
      $db_state = $lib::create( 'database\state', $columns['state_id'] );
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
