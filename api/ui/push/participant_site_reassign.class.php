<?php
/**
 * participant_site_reassign.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: participant site_reassign
 *
 * Syncs participant information between Sabretooth and Mastodon
 */
class participant_site_reassign extends \cenozo\ui\push
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'participant', 'site_reassign', $args );
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

    $db_service = lib::create( 'database\service', $this->get_argument( 'service_id' ) );

    $uid_list_string = preg_replace( '/[^a-zA-Z0-9]/', ' ', $this->get_argument( 'uid_list' ) );
    $uid_list_string = trim( $uid_list_string );
    $uid_list = array_unique( preg_split( '/\s+/', $uid_list_string ) );

    foreach( $uid_list as $uid )
    {
      // determine the participant record and make sure it is valid
      $db_participant = $participant_class_name::get_unique_record( 'uid', $uid );

      if( !is_null( $db_participant ) )
      {
        $column_name = $db_service->name.'_site_id';
        $args = array( 'id' => $db_participant->id,
                       'columns' => array( $column_name => $this->get_argument( 'site_id' ) ) );
        // this will work because the participant_edit operation overrides the default edit
        // behaviour when site_id is included in the columns argument
        $operation = lib::create( 'ui\push\participant_edit', $args );

        try
        {
          $operation->process();
        }
        catch( \cenozo\exception\runtime $e )
        {
          if( RUNTIME__CENOZO_DATABASE_PARTICIPANT__SET_PREFERRED_SITE__ERRNO == $e->get_number() )
          {
            $e = lib::create( 'exception\notice',
              sprintf( 'UID list contained participant which %s does not have access to (%s), '.
                       'operation aborted.',
                       $db_service->name,
                       $db_participant->uid ),
              $e );
          }

          throw $e;
        }
      }
    }
  }
}
