<?php
/**
 * patch.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\participant;
use cenozo\lib, cenozo\log;

/**
 * Special service for handling the patch meta-resource
 */
class patch extends \cenozo\service\patch
{
  /**
   * Override parent method
   */
  protected function prepare()
  {
    $this->extract_parameter_list = array_merge(
      $this->extract_parameter_list,
      ['preferred_site_id', 'reverse_withdraw', 'reverse_proxy_initiation', 'explain_last_trace']
    );

    parent::prepare();
  }


  /**
   * Override parent method
   */
  protected function validate()
  {
    parent::validate();

    if( $this->may_continue() )
    {
      $db_role = lib::create( 'business\session' )->get_role();

      // make sure that only tier 2+ roles can reverse a withdraw
      if( $this->get_argument( 'reverse_withdraw', false ) && 2 > $db_role->tier ) $this->status->set_code( 403 );

      // only admins can change the date of birth
      $patch_array = parent::get_file_as_array();
      if( array_key_exists( 'date_of_birth', $patch_array ) && 3 > $db_role->tier ) $this->status->set_code( 403 );
    }
  }

  /**
   * Override parent method
   */
  protected function execute()
  {
    parent::execute();

    $db_participant = $this->get_leaf_record();

    // process the preferred site, if it exists
    $preferred_site_id = $this->get_argument( 'preferred_site_id', 'NONE' );
    if( 'NONE' != $preferred_site_id ) $this->set_preferred_site();

    // reverse the participant's withdraw, if needed
    if( $this->get_argument( 'reverse_withdraw', false ) )
    {
      $survey_manager = lib::create( 'business\survey_manager' );
      $survey_manager->reverse_withdraw( $db_participant );
    }

    // reverse the participant's proxy, if needed
    if( $this->get_argument( 'reverse_proxy_initiation', false ) )
    {
      $survey_manager = lib::create( 'business\survey_manager' );
      $survey_manager->reverse_proxy_initiation( $db_participant );
    }

    // explain the participant's last trace, if needed
    $explain_last_trace = $this->get_argument( 'explain_last_trace', false );
    if( false !== $explain_last_trace )
    {
      $db_trace = $db_participant->get_last_trace();
      foreach( $explain_last_trace as $column => $value ) $db_trace->$column = $value;
      $db_trace->save();
    }
  }

  /**
   * Set's the participants preferred site
   */
  protected function set_preferred_site()
  {
    $this->get_leaf_record()->set_preferred_site(
      lib::create( 'business\session' )->get_application(),
      $this->get_argument( 'preferred_site_id' )
    );
  }
}
