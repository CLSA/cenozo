<?php
/**
 * consent_add.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget consent add
 */
class consent_add extends base_view
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
    parent::__construct( 'consent', 'add', $args );
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
    
    // add items to the view
    $this->add_item( 'participant_id', 'hidden' );
    $this->add_item( 'accept', 'boolean', 'Accept',
      'Whether the participant accepted (true) or denied (false) consent.' );
    $this->add_item( 'written', 'boolean', 'Written',
      'Whether the consent was written (true) or verbal (false).' );
    $this->add_item( 'date', 'date', 'Date' );
    $this->add_item( 'note', 'text', 'Note' );
  }

  /**
   * Sets up the operation with any pre-execution instructions that may be necessary.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();
    
    // this widget must have a parent, and it's subject must be a participant
    if( is_null( $this->parent ) || 'participant' != $this->parent->get_subject() )
      throw lib::create( 'exception\runtime',
        'Consent widget must have a parent with participant as the subject.', __METHOD__ );

    // set the view's items
    $this->set_item( 'participant_id', $this->parent->get_record()->id );
    $this->set_item( 'accept', false, true );
    $this->set_item( 'written', false, true );
    $this->set_item( 'date', '', true );
    $this->set_item( 'note', '' );
  }
}
