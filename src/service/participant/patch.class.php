<?php
/**
 * patch.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
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

    return $patch_array;
  }

  /**
   * Override parent method
   */
  protected function validate()
  {
    parent::validate();

    if( 300 > $this->status->get_code() )
    {
      $this->get_file_as_array(); // make sure to process the site array before the following checks

      $db_role = lib::create( 'business\session' )->get_role();

      // make sure that only tier 2+ roles can reverse a withdraw
      if( $this->reverse_withdraw && 2 > $db_role->tier ) $this->status->set_code( 403 );
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
  }

  /**
   * TODO: document
   */
  protected function set_preferred_site()
  {
    $this->get_leaf_record()->set_preferred_site(
      lib::create( 'business\session' )->get_application(),
      $this->preferred_site_id );
  }

  /**
   * TODO: document
   */
  protected function reverse_withdraw()
  {
    $survey_manager = lib::create( 'business\survey_manager' );
    $survey_manager->reverse_withdraw( $this->get_leaf_record() );
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
}
