<?php
/**
 * site_new.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: site new
 *
 * Create a new site.
 */
class site_new extends base_new
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'site', $args );
  }

  /**
   * Validate the operation.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function validate()
  {
    parent::validate();

    $columns = $this->get_argument( 'columns' );

    // make sure the name column isn't blank
    if( !array_key_exists( 'name', $columns ) || 0 == strlen( $columns['name'] ) )
      throw lib::create( 'exception\notice', 'The site name cannot be left blank.', __METHOD__ );

    // validate the postcode
    if( array_key_exists( 'postcode', $columns ) && $columns['postcode'] )
    {
      if( !preg_match( '/^[A-Z][0-9][A-Z] [0-9][A-Z][0-9]$/', $columns['postcode'] ) &&
          !preg_match( '/^[0-9]{5}$/', $columns['postcode'] ) )
        throw lib::create( 'exception\notice',
          'Postal codes must be in "A1A 1A1" format, zip codes in "01234" format.', __METHOD__ );

      $postcode_class_name = lib::get_class_name( 'database\postcode' );
      $db_postcode = $postcode_class_name::get_match( $columns['postcode'] );
      if( is_null( $db_postcode ) ) 
        throw lib::create( 'exception\notice',
          'The postcode is invalid and cannot be used.', __METHOD__ );
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
    $columns = $this->get_argument( 'columns' );

    // source the postcode to determine the region
    $db_address = lib::create( 'database\address' );
    $db_address->postcode = $columns['postcode'];
    $db_address->source_postcode();
    $this->get_record()->region_id = $db_address->region_id;

    parent::execute();
  }
}
