<?php
/**
 * language_edit.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: language edit
 *
 * Edit a language.
 */
class language_edit extends base_edit
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'language', $args );
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
    parent::validate();

    // check to make sure the service default language isn't being disabled
    $columns = $this->get_argument( 'columns' );
    if( array_key_exists( 'active', $columns ) )
    {
      $db_service = lib::create( 'business\session' )->get_service();
      if( false == $columns['active'] && $this->get_argument( 'id' ) == $db_service->language_id )
        throw lib::create( 'exception\notice',
          'Unable to disable the language since it is the default service language.',
          __METHOD__ );
    }
  }
}
