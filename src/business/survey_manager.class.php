<?php
/**
 * survey_manager.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\business;
use cenozo\lib, cenozo\log;

/**
 * The survey manager is responsible for business-layer survey functionality.
 */
class survey_manager extends \cenozo\singleton
{
  /**
   * Constructor.
   * 
   * Since this class uses the singleton pattern the constructor is never called directly.  Instead
   * use the {@link singleton} method.
   * @access protected
   */
  protected function __construct()
  {
    $setting_manager = lib::create( 'business\setting_manager' );
    if( !$setting_manager->get_setting( 'module', 'script' ) )
    {
      throw lib::create( 'exception\runtime',
        'Tried to create the survey-manager but the script module is not enabled.',
        __METHOD__ );
    }
  }

  /**
   * Removes the participant's withdraw script token and survey
   * Note that this method does nothing if the participant has not completed the withdraw script
   * @param database\participant $db_participant
   * @access public
   */
  public function reverse_withdraw( $db_participant )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $script_class_name = lib::get_class_name( 'database\script' );
    $consent_type_class_name = lib::get_class_name( 'database\consent_type' );
    $setting_manager = lib::create( 'business\setting_manager' );
    $withdraw_option_and_delink = $setting_manager->get_setting( 'general', 'withdraw_option_and_delink' );

    $db_script = $script_class_name::get_unique_record( 'name', 'Withdraw' );
    if( is_null( $db_script ) ) throw lib::create( 'exception\runtime', 'Withdraw script not found.', __METHOD__ );

    $cenozo_manager = lib::create( 'business\cenozo_manager', lib::create( 'business\session' )->get_pine_application() );
    $cenozo_manager->delete( sprintf(
      'qnaire/%d/response/participant_id=%d',
      $db_script->pine_qnaire_id,
      $db_participant->id
    ) );

    // make sure the most recent participation consent is not negative
    $db_consent_type = $consent_type_class_name::get_unique_record( 'name', 'participation' );
    $db_last_consent = $db_participant->get_last_consent( $db_consent_type );
    if( !is_null( $db_last_consent ) && !$db_last_consent->accept )
    {
      $db_consent = lib::create( 'database\consent' );
      $db_consent->participant_id = $db_participant->id;
      $db_consent->consent_type_id = $db_consent_type->id;
      $db_consent->accept = true;
      $db_consent->written = false;
      $db_consent->datetime = $util_class_name::get_datetime_object();
      $db_consent->note = 'Added as part of reversing the withdraw process.';
      $db_consent->save();
    }

    if( $withdraw_option_and_delink )
    {
      // Reverse the last negative HIN access consent record if it was created by the withdraw script
      $db_consent_type = $consent_type_class_name::get_unique_record( 'name', 'HIN access' );
      $db_last_consent = $db_participant->get_last_consent( $db_consent_type );
      if( !is_null( $db_last_consent ) &&
          !$db_last_consent->accept &&
          false !== strpos( $db_last_consent->note, 'Created by Pine after questionnaire "Withdraw" was completed' ) )
      {
        $db_consent = lib::create( 'database\consent' );
        $db_consent->participant_id = $db_participant->id;
        $db_consent->consent_type_id = $db_consent_type->id;
        $db_consent->accept = true;
        $db_consent->written = false;
        $db_consent->datetime = $util_class_name::get_datetime_object();
        $db_consent->note = 'Added as part of reversing the withdraw process.';
        $db_consent->save();
      }
    }

    $db_participant->delink = false;
    $db_participant->save();
  }

  /**
   * Removes the participant's proxy initiation script token and survey
   * Note that this method does nothing if the participant has not completed the proxy initiation script
   * @param database\participant $db_participant
   * @access public
   */
  public function reverse_proxy_initiation( $db_participant )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $script_class_name = lib::get_class_name( 'database\script' );
    $session = lib::create( 'business\session' );
    $db_user = $session->get_user();
    $db_site = $session->get_site();
    $db_role = $session->get_role();
    $db_application = $session->get_application();
    $db_pine_application = $session->get_pine_application();

    $db_script = $script_class_name::get_unique_record( 'name', 'Proxy Initiation' );
    if( is_null( $db_script ) ) throw lib::create( 'exception\runtime', 'Proxy Initiation script not found.', __METHOD__ );

    $cenozo_manager = lib::create( 'business\cenozo_manager', $db_pine_application );
    $cenozo_manager->delete( sprintf(
      'qnaire/%d/response/participant_id=%d',
      $db_script->pine_qnaire_id,
      $db_participant->id
    ) );

    // make sure to set the most recent proxy to empty (no proxy status)
    $db_last_proxy = $db_participant->get_last_proxy();
    if( !is_null( $db_last_proxy ) )
    {
      $db_proxy = lib::create( 'database\proxy' );
      $db_proxy->participant_id = $db_participant->id;
      $db_proxy->proxy_type_id = NULL;
      $db_proxy->datetime = $util_class_name::get_datetime_object();
      $db_proxy->user_id = $db_user->id;
      $db_proxy->site_id = $db_site->id;
      $db_proxy->role_id = $db_role->id;
      $db_proxy->application_id = $db_application->id;
      $db_proxy->note = 'Added as part of reversing the proxy initiation process.';
      $db_proxy->save();
    }
  }

  /**
   * Creates a temporary table with all withdraw option and delink values
   */
  public function create_option_and_delink_table()
  {
    $util_class_name = lib::get_class_name( 'util' );
    $participant_class_name = lib::get_class_name( 'database\participant' );

    $db_pine_app = lib::create( 'business\session' )->get_pine_application();
    $cenozo_manager = lib::create( 'business\cenozo_manager', $db_pine_app );
    $modifier_obj = array( 'limit' => 1000000 );
    $data = $cenozo_manager->get( sprintf(
      'qnaire/name=Withdraw/response?modifier=%s&export=1&attributes=1',
      $util_class_name::json_encode( $modifier_obj )
    ) );

    // loop through the data and create a temporary table containing the option and delink details
    $participant_class_name::db()->execute(
      'CREATE TEMPORARY TABLE option_and_delink( '.
        'uid VARCHAR(45) NOT NULL, '.
        'option CHAR(7) NOT NULL, '.
        'hin TINYINT(1) NULL DEFAULT NULL, '.
        'delink TINYINT(1) NOT NULL, '.
        'PRIMARY KEY (uid) '.
      ')'
    );

    if( 0 < count( $data ) )
    {
      $hin_name = 'attribute:HIN_consent';
      $insert_records = [];
      foreach( $data as $obj )
      {
        $delink = false;
        $option = 'default';
        if( 'YES' == $obj->SHOW_OPTIONS )
        {
          if( preg_match( '/OPTION([0-9])_/', $obj->SELECT_OPTION, $matches ) )
          {
            $delink_options = array(
              'OPTION3_HIN_COMP', 'OPTION3_HIN_TRACK', 'OPTION2_NO_HIN_COMP', 'OPTION2_NO_HIN_TRACK'
            );
            if( in_array( $obj->SELECT_OPTION, $delink_options ) ) $delink = true;
            $option = $matches[1];
          }
        }

        $insert_record[] = sprintf(
          '( "%s", "%s", %s, %d )',
          $obj->uid,
          $option,
          property_exists( $obj, $hin_name ) ? sprintf( '%d', $obj->$hin_name ) : 'NULL',
          $delink
        );
      }
      
      $participant_class_name::db()->execute( sprintf(
        'INSERT INTO option_and_delink VALUES %s',
        implode( ',', $insert_record )
      ) );
    }
  }
}
