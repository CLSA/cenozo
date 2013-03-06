<?php
/**
 * service_list.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget service list
 */
class service_list extends base_list
{
  /**
   * Constructor
   * 
   * Defines all variables required by the service list.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args An associative array of arguments to be processed by the widget
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'service', $args );
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
    
    $this->add_column( 'title', 'string', 'Title', true );
    if( !is_null( $this->parent ) && 'cohort' == $this->parent->get_subject() )
      $this->add_column( 'service_has_cohort.grouping', 'string', 'Grouping', true );
    $this->add_column( 'version', 'string', 'Version', true );
    $this->add_column( 'sites', 'number', 'Sites', false );
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
      $row = array( 'title' => $record->title,
                    'version' => $record->version,
                    'sites' => $record->get_site_count() );
      if( !is_null( $this->parent ) && 'cohort' == $this->parent->get_subject() )
        $row['service_has_cohort.grouping'] =
          $record->get_cohort_grouping( $this->parent->get_record() );
      $this->add_row( $record->id, $row );
    }
  }
}
