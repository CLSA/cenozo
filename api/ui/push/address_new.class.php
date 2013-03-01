<?php
/**
 * address_new.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: address new
 *
 * Create a new address.
 */
class address_new extends base_new
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'address', $args );
  }

  /**
   * Validate the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  protected function validate()
  {
    parent::validate();

    $columns = $this->get_argument( 'columns' );
    
    // validate the postcode
    if( !preg_match( '/^[A-Z][0-9][A-Z] [0-9][A-Z][0-9]$/', $columns['postcode'] ) && // postal code
        !preg_match( '/^[0-9]{5}$/', $columns['postcode'] ) ) // zip code
      throw lib::create( 'exception\notice',
        'Postal codes must be in "A1A 1A1" format, zip codes in "01234" format.', __METHOD__ );

    $postcode_class_name = lib::get_class_name( 'database\postcode' );
    $db_postcode = $postcode_class_name::get_match( $columns['postcode'] );
    if( is_null( $db_postcode ) ) 
      throw lib::create( 'exception\notice',
        'The postcode is invalid and cannot be used.', __METHOD__ );
  }

  /**
   * This method executes the operation's purpose.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function execute()
  {
    $columns = $this->get_argument( 'columns' );
    $this->get_record()->postcode = $columns['postcode'];
    $this->get_record()->source_postcode();

    parent::execute();
  }
}
