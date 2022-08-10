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
  public function get_file_as_array()
  {
    // remove preferred_site_id from the patch array
    $patch_array = parent::get_file_as_array();
    if( array_key_exists( 'preferred_site_id', $patch_array ) )
    {
      $this->preferred_site_id = $patch_array['preferred_site_id'];
      $this->update_preferred_site = true;
      unset( $patch_array['preferred_site_id'] );
    }

    if( array_key_exists( 'reverse_withdraw', $patch_array ) )
    {
      $this->reverse_withdraw = true;
      unset( $patch_array['reverse_withdraw'] );
    }

    if( array_key_exists( 'reverse_proxy_initiation', $patch_array ) )
    {
      $this->reverse_proxy_initiation = true;
      unset( $patch_array['reverse_proxy_initiation'] );
    }

    if( array_key_exists( 'explain_last_trace', $patch_array ) )
    {
      $this->explain_last_trace = $patch_array['explain_last_trace'];
      unset( $patch_array['explain_last_trace'] );
    }

    return $patch_array;
  }

  /**
   * Override parent method
   */
  protected function validate()
  {
    parent::validate();

    if( $this->may_continue() )
    {
      $this->get_file_as_array(); // make sure to process the site array before the following checks

      $db_role = lib::create( 'business\session' )->get_role();

      // make sure that only tier 2+ roles can reverse a withdraw
      if( $this->reverse_withdraw && 2 > $db_role->tier ) $this->status->set_code( 403 );

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

    // process the preferred site, if it exists
    if( $this->update_preferred_site ) $this->set_preferred_site();

    // reverse the participant's withdraw, if needed
    if( $this->reverse_withdraw ) $this->reverse_withdraw();

    // reverse the participant's proxy, if needed
    if( $this->reverse_proxy_initiation ) $this->reverse_proxy_initiation();

    // explain the participant's last trace, if needed
    if( $this->explain_last_trace ) $this->explain_last_trace();
  }

  /**
   * Set's the participants preferred site
   */
  protected function set_preferred_site()
  {
    $this->get_leaf_record()->set_preferred_site(
      lib::create( 'business\session' )->get_application(),
      $this->preferred_site_id );
  }

  /**
   * Reverses the participant's withdraw state
   */
  protected function reverse_withdraw()
  {
    $survey_manager = lib::create( 'business\survey_manager' );
    $survey_manager->reverse_withdraw( $this->get_leaf_record() );
  }

  /**
   * Reverses the participant's proxy state
   */
  protected function reverse_proxy_initiation()
  {
    $survey_manager = lib::create( 'business\survey_manager' );
    $survey_manager->reverse_proxy_initiation( $this->get_leaf_record() );
  }

  /**
   * Sets the reason for the last trace
   */
  protected function explain_last_trace()
  {
    $db_trace = $this->get_leaf_record()->get_last_trace();
    foreach( $this->explain_last_trace as $column => $value )
      $db_trace->$column = $value;
    $db_trace->save();
  }

  /**
   * Whether to update the participant's preferred site
   * @var boolean
   * @access protected
   */
  protected $update_preferred_site = false;

  /**
   * What to change the participant's preferred site to
   * @var int
   * @access protected
   */
  protected $preferred_site_id;

  /**
   * Whether to reverse a participant's withdraw
   * @var boolean
   * @access protected
   */
  protected $reverse_withdraw;

  /**
   * Whether to reverse a participant's proxy
   * @var boolean
   * @access protected
   */
  protected $reverse_proxy_initiation;

  /**
   * Used to define the reason for this participant's last trace
   * @var object
   * @access protected
   */
  protected $explain_last_trace;
}
