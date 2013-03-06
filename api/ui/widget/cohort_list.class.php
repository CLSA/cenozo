<?php
/**
 * cohort_list.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget cohort list
 */
class cohort_list extends base_list
{
  /**
   * Constructor
   * 
   * Defines all variables required by the cohort list.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args An associative array of arguments to be processed by the widget
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'cohort', $args );
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
    
    $this->add_column( 'name', 'string', 'Name', true );
    if( !is_null( $this->parent ) &&
        'service' == $this->parent->get_subject() &&
        'view' == $this->parent->get_name() )
      $this->add_column( 'service_has_cohort.grouping', 'string', 'Grouping', true );
    $this->add_column( 'participants', 'number', 'Participants', false );
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
      $row = array( 'name' => $record->name,
                    'participants' => $record->get_participant_count() );
      if( !is_null( $this->parent ) &&
          'service' == $this->parent->get_subject() &&
          'view' == $this->parent->get_name() )
        $row['service_has_cohort.grouping'] =
          $this->parent->get_record()->get_cohort_grouping( $record );
      $this->add_row( $record->id, $row );
    }
  }
}
