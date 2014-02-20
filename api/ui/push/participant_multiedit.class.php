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
 * Edits multiple participants at once
 */
class participant_multiedit extends \cenozo\ui\push\base_participant_multi
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'multiedit', $args );
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

    if( 'dnc' != $active ) $columns['active'] = 'y' == $active;
    if( 'dnc' != $gender ) $columns['gender'] = $gender;
    if( 'dnc' != $age_group_id ) $columns['age_group_id'] = $age_group_id;
    if( 'dnc' != $state_id ) $columns['state_id'] = $state_id;
    if( 'dnc' != $language ) $columns['language'] = $language;
    if( 'dnc' != $override_quota ) $columns['override_quota'] = 'y' == $override_quota;

    $participant_class_name::multiedit( $this->modifier, $columns );
  }
}
