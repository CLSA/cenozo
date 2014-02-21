<?php
/**
 * participant_multiedit.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: participant multiedit
 *
 * Syncs participant information between Sabretooth and Mastodon
 */
class participant_multiedit extends \cenozo\ui\push
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'participant', 'multiedit', $args );
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

    $active = $this->get_argument( 'active' );
    $gender = $this->get_argument( 'gender' );
    $age_group_id = $this->get_argument( 'age_group_id' );
    $state_id = $this->get_argument( 'state_id' );
    $language = $this->get_argument( 'language' );
    $override_quota = $this->get_argument( 'override_quota' );

    $uid_list_string = preg_replace( '/[^a-zA-Z0-9]/', ' ', $this->get_argument( 'uid_list' ) );
    $uid_list_string = trim( $uid_list_string );
    $uid_list = array_unique( preg_split( '/\s+/', $uid_list_string ) );

    foreach( $uid_list as $uid )
    {
      // determine the participant record and make sure it is valid
      $db_participant = $participant_class_name::get_unique_record( 'uid', $uid );

      if( !is_null( $db_participant ) )
      {
        $columns = array();
        if( -1 != $active ) $columns['active'] = $active;
        if( -1 != $gender ) $columns['gender'] = $gender;
        if( -1 != $age_group_id ) $columns['age_group_id'] = $age_group_id;
        if( -1 != $state_id ) $columns['state_id'] = $state_id;
        if( -1 != $language ) $columns['language'] = $language;
        if( -1 != $override_quota ) $columns['override_quota'] = $override_quota;

        $args = array( 'columns' => $columns,
                       'id' => $db_participant->id );
        $operation = lib::create( 'ui\push\participant_edit', $args );
        $operation->process();
      }
    }
  }
}
