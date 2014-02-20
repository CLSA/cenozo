<?php
/**
 * base_participant_multi.class.php
 * 
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\pull;
use cenozo\lib, cenozo\log;

/**
 * pull: participant multiedit
 * 
 * @abstract
 */
class base_participant_multi extends \cenozo\ui\pull
{
  /**
   * Constructor
   * 
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param string $name The name of the operation.
   * @param array $args Pull arguments.
   * @access public
   */
  public function __construct( $name, $args )
  {
    parent::__construct( 'participant', $name, $args );
  }

  /**
   * Processes arguments, preparing them for the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function prepare()
  {
    parent::prepare();

    $uid_list_string = preg_replace( '/[^a-zA-Z0-9]/', ' ', $this->get_argument( 'uid_list' ) );
    $uid_list_string = trim( $uid_list_string );
    $this->uid_list = array_unique( preg_split( '/\s+/', $uid_list_string ) );

    $md5 = $this->get_argument( 'md5', false );
    if( $md5 )
    { // process the temporary file
      $filename = sprintf( '%s/%s', TEMPORARY_FILES_PATH, $md5 );
      $data = file_get_contents( $filename );
      if( false === $data )
        throw lib::create( 'database\notice', 'Unable to load temporary file', __METHOD__ );

      $lines = preg_split( '/[\n\r]+/', $data );
      foreach( $lines as $line )
      {
        $items = str_getcsv( $line );
        if( 0 < count( $items ) && 0 < strlen( $items[0] ) ) $this->uid_list[] = $items[0];
      }
      $this->uid_list = array_unique( $this->uid_list );
    }

    $this->modifier = lib::create( 'database\modifier' );
    $this->modifier->where( 'uid', 'IN', $this->uid_list );
  }

  /**
   * Validate the operation.  If validation fails this method will throw a notice exception.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws excpetion\argument, exception\permission
   * @access protected
   */
  protected function validate()
  {
    // make sure the uid list isn't empty
    if( 0 == count( $this->uid_list ) )
      throw lib::create( 'exception\notice', 'No participants have been selected.', __METHOD__ );
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

    $participant_class_name = lib::get_class_name( 'database\participant' );
    $cohort_class_name = lib::get_class_name( 'database\cohort' );

    $this->data = array();
    foreach( $cohort_class_name::select() as $db_cohort )
    {
      $modifier = clone $this->modifier;
      $modifier->where( 'cohort_id', '=', $db_cohort->id );
      $this->data[sprintf( 'Participants affected (%s)', $db_cohort->name )] =
        $participant_class_name::count( $modifier );
    }
  }
  
  /**
   * Lists are always returned in JSON format.
   * 
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_data_type() { return "json"; }

  /**
   * An array of UIDs provided by the widget.
   * @var array
   * @access protected
   */
  protected $uid_list = array();

  /**
   * The modifier created by restricting to the participant array
   * @var database\modifier
   * @access protected
   */
  protected $modifier;
}
