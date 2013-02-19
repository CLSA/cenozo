<?php
/**
 * quota_list.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget quota list
 */
class quota_list extends site_restricted_list
{
  /**
   * Constructor
   * 
   * Defines all variables required by the quota list.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args An associative array of arguments to be processed by the widget
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'quota', $args );
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
    
    $this->add_column( 'site.name', 'string', 'Site', true );
    $this->add_column( 'region.name', 'string', 'Region', true );
    $this->add_column( 'gender', 'string', 'Gender', true );
    $this->add_column( 'age_group.lower', 'string', 'Age Group', true );
    $this->add_column( 'population', 'number', 'Population', true );
    $this->add_column( 'disabled', 'boolean', 'Disabled', true );
  }
  
  /**
   * Set the rows array needed by the template.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();
    
    foreach( $this->get_record_list() as $record )
    {
      $db_age_group = $record->get_age_group();

      // assemble the row for this record
      $this->add_row( $record->id,
        array( 'site.name' => $record->get_site()->get_full_name(),
               'region.name' => $record->get_region()->name,
               'gender' => $record->gender,
               'age_group.lower' => $db_age_group->to_string(),
               'population' => $record->population,
               'disabled' => $record->disabled ) );
    }
  }
}
