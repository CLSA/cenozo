<?php
/**
 * phone_new.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: phone new
 *
 * Create a new phone.
 */
class phone_new extends base_new
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'phone', $args );
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

    $util_class_name = lib::get_class_name( 'util' );
    $columns = $this->get_argument( 'columns' );

    // make sure the number column isn't blank
    if( !array_key_exists( 'number', $columns ) )
      throw lib::create( 'exception\notice', 'The number cannot be left blank.', __METHOD__ );

    // validate the phone number
    $number_only = preg_replace( '/[^0-9]/', '', $columns['number'] );
    if( 10 != strlen( $number_only ) )
      throw lib::create( 'exception\notice',
        'Phone numbers must have exactly 10 digits.', __METHOD__ );

    $formatted_number = sprintf( '%s-%s-%s',
                                 substr( $number_only, 0, 3 ),
                                 substr( $number_only, 3, 3 ),
                                 substr( $number_only, 6 ) );
    if( !$util_class_name::validate_phone_number( $formatted_number ) )
      throw lib::create( 'exception\notice',
        sprintf( 'The provided number "%s" is not a valid North American phone number.',
                 $formatted_number ),
        __METHOD__ );
  }
}
