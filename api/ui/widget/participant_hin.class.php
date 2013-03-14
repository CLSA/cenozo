<?php
/**
 * participant_hin.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget participant hin
 */
class participant_hin extends base_view
{
  /**
   * Constructor
   * 
   * Defines all variables which need to be set for the associated template.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args An associative array of arguments to be processed by the widget
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'participant', 'hin', $args );
  }

  /**
   * Processes arguments, preparing them for the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  protected function prepare()
  {
    parent::prepare();

    $operation_class_name = lib::create( 'database\operation' );

    $this->set_heading( sprintf( 'Health Insurance Number for %s', $this->get_record()->uid ) );
    $db_operation = $operation_class_name::get_operation( 'push', 'participant', 'edit' );
    $this->set_editable( lib::create( 'business\session' )->is_allowed( $db_operation ) );

    // we need to manually set the editable state based on whether the user has access to the
    // participant hin push operation
    $db_hin = $this->get_record()->get_hin();
    $is_valid = is_null( $db_hin ) ? NULL : $db_hin->is_valid();
    $format = is_null( $db_hin ) || is_null( $db_hin->get_format() ) ? NULL : $db_hin->get_format();

    $code_help = '';
    if( !is_null( $is_valid ) && !is_null( $format ) )
      $code_help = $is_valid
                 ? 'Code is valid.'
                 : sprintf( 'Code is invalid, expecting format to be "%s".', $format );

    // create an associative array with everything we want to display about the participant
    $this->add_item( 'hin_access', 'boolean', 'Consent to provide' );
    $this->add_item( 'hin_future_access', 'boolean', 'Consent for future linkage' );
    $this->add_item( 'hin_code', 'string', 'Health Insurance Number', $code_help );
    $this->add_item( 'hin_region_id', 'enum', 'Health Insurance Province' );
  }

  /**
   * Finish setting the variables in a widget.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();

    $region_class_name = lib::get_class_name( 'database\region' );
    $db_hin = $this->get_record()->get_hin();

    // create enum arrays
    $regions = array();
    $region_mod = lib::create( 'database\modifier' );
    $region_mod->where( 'country', '=', 'Canada' );
    $region_mod->order( 'name' );
    foreach( $region_class_name::select( $region_mod ) as $db_region )
      $regions[$db_region->id] = $db_region->name;

    $this->set_item( 'hin_access',
      is_null( $db_hin ) ? NULL : $db_hin->access, false );
    $this->set_item( 'hin_future_access',
      is_null( $db_hin ) ? NULL : $db_hin->future_access, false );
    $this->set_item( 'hin_code',
      is_null( $db_hin ) ? NULL : $db_hin->code, false );
    $this->set_item( 'hin_region_id',
      is_null( $db_hin ) || is_null( $db_hin->region_id ) ?
      0 : $db_hin->region_id, false, $regions );
  }
}
