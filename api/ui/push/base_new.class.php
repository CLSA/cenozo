<?php
/**
 * base_new.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * Base class for all push operations which create a new record.
 */
abstract class base_new extends base_record
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $subject The widget's subject.
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $subject, $args )
  {
    parent::__construct( $subject, 'new', $args );
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

    $columns = $this->get_argument( 'columns', array() );

    // check for time range validity, if necessary
    if( array_key_exists( 'start_time', $columns ) &&
        array_key_exists( 'end_time', $columns ) )
    { 
      if( strtotime( $columns['start_time'] ) >= strtotime( $columns['end_time'] ) )
      { 
        throw lib::create( 'exception\notice',
          sprintf( 'Start and end times (%s to %s) are not valid.',
                   $columns['start_time'],
                   $columns['end_time'] ),
          __METHOD__ );
      }
    } 
    else if( array_key_exists( 'start_datetime', $columns ) &&
             array_key_exists( 'end_datetime', $columns ) )
    { 
      if( strtotime( $columns['start_datetime'] ) >= strtotime( $columns['end_datetime'] ) )
      { 
        throw lib::create( 'exception\notice',
          sprintf( 'Start and end date-times (%s to %s) are not valid.',
                   $columns['start_datetime'],
                   $columns['end_datetime'] ),
          __METHOD__ );
      }
    } 
    else if( array_key_exists( 'start_date', $columns ) &&
             array_key_exists( 'end_date', $columns ) )
    { 
      if( strtotime( $columns['start_date'] ) >= strtotime( $columns['end_date'] ) )
      { 
        throw lib::create( 'exception\notice',
          sprintf( 'Start and end dates (%s to %s) are not valid.',
                   $columns['start_date'],
                   $columns['end_date'] ),
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
    
    $columns = $this->get_argument( 'columns', array() );

    // set record column values
    foreach( $columns as $column => $value ) $this->get_record()->$column = $value;

    try
    {
      $this->get_record()->save();
    }
    catch( \cenozo\exception\database $e )
    { // help describe exceptions to the user
      if( $e->is_duplicate_entry() )
      {
        throw lib::create( 'exception\notice',
          'Unable to create the new '.$this->get_subject().' because it is not unique.',
          __METHOD__, $e );
      }
      else if( $e->is_missing_data() )
      {
        $matches = array();
        $found = preg_match( "/Column '[^']+'/", $e->get_raw_message(), $matches );

        if( $found )
        {
          $message = sprintf(
            'You must specify "%s" in order to create a new %s.',
            substr( $matches[0], 8, -1 ),
            $this->get_subject() );
        }
        else
        {
          $message = sprintf(
            'Unable to create the new %s, not all mandatory fields have been filled out.',
            $this->get_subect() );
        }

        throw lib::create( 'exception\notice', $message, __METHOD__, $e );
      }

      throw $e;
    }
  }
}
?>
