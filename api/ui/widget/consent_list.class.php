<?php
/**
 * consent_list.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget consent list
 */
class consent_list extends base_list
{
  /**
   * Constructor
   * 
   * Defines all variables required by the consent list.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args An associative array of arguments to be processed by the widget
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'consent', $args );
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
    
    $this->add_column( 'accept', 'boolean', 'Accept', true );
    $this->add_column( 'written', 'boolean', 'Written', true );
    $this->add_column( 'date', 'datetime', 'Date', true );

    // only allow admins to edit or delete consent records
    if( 3 > lib::create( 'business\session' )->get_role()->tier ) $this->set_removable( false );
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

    foreach( $this->get_record_list() as $record )
    {
      $this->add_row( $record->id,
        array( 'accept' => $record->accept,
               'written' => $record->written,
               'date' => $record->date ) );
    }
  }
}
