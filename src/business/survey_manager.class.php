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
   * Writes all columns of a token for the given script and participant
   * 
   * This method will try and fill in all columns of a token row, with the exception of the token
   * column.  To set the token use database\limesurvey\tokens::determine_token_string() static method.
   * Note that this method is used for Limesurvey scripts only (not used for Pine)
   * @param database\script $db_script The script that the token belongs to
   * @param database\participant $db_participant The participant that the token belongs to
   * @param database\tokens $db_tokens The token to populate (if null a new one will be created)
   * @return database\tokens
   * @access protected
   */
  public function populate_token( $db_script, $db_participant, $db_tokens = NULL )
  {
    if( 'pine' == $db_script->get_type() )
      throw lib::create( 'exception\runtime',
        'The survey_manager::populate_token() should never be called for a Pine script.',
        __METHOD__ );

    $data_manager = lib::create( 'business\data_manager' );

    $util_class_name = lib::get_class_name( 'util' );
    $tokens_class_name = lib::get_class_name( 'database\limesurvey\tokens' );
    $old_sid = $tokens_class_name::get_sid();
    $tokens_class_name::set_sid( $db_script->sid );
    if( is_null( $db_tokens ) ) $db_tokens = lib::create( 'database\limesurvey\tokens' );

    // fill in the token based on the script and participant
    $db_tokens->firstname = $db_participant->honorific.' '.$db_participant->first_name;
    if( 0 < strlen( $db_participant->other_name ) )
      $db_tokens->firstname .= sprintf( ' (%s)', $db_participant->other_name );
    $db_tokens->lastname = $db_participant->last_name;
    $db_tokens->email = $db_participant->email;

    // fill in the attributes
    $db_surveys = lib::create( 'database\limesurvey\surveys', $db_script->sid );
    foreach( $db_surveys->get_token_attribute_names() as $key => $value )
    {
      $invalid = false;
      try
      {
        if( !$data_manager->is_value( $value ) ) $invalid = true;
        else
        {
          $db_tokens->$key = $util_class_name::utf8_encode(
            0 === strpos( $value, 'participant.' ) ?
              $data_manager->get_participant_value( $db_participant, $value ) :
              $data_manager->get_value( $value )
          );
        }
      }
      catch( \cenozo\exception\argument $e )
      {
        $invalid = true;
      }

      if( $invalid )
      {
        log::warning( sprintf(
          'Cannot populate invalid token attribute "%s" for script "%s" and participant "%s"',
          $value,
          $db_script->name,
          $db_participant->uid ) );
      }
    }

    $db_tokens->save();
    $tokens_class_name::set_sid( $old_sid );
    return $db_tokens;
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
   * Resolves the supporting status of all participants who need a supporting script's status checked
   * Note that this method is used for Limesurvey scripts only (not used for Pine)
   */
  public function process_all_supporting_script_checks()
  {
    $total = 0;

    $script_class_name = lib::create( 'database\script' );
    $script_mod = lib::create( 'database\modifier' );
    $script_mod->where( 'supporting', '=', true );
    foreach( $script_class_name::select_objects( $script_mod ) as $db_script )
    {
      if( 'pine' == $db_script->get_type() )
      {
        log::warning( 'Cenozo does not yet support Pine-based supporting scripts.' );
      }
      else
      {
        $participant_class_name = lib::get_class_name( 'database\participant' );
        $supporting_script_check_class_name = lib::get_class_name( 'database\supporting_script_check' );
        $setting_manager = lib::create( 'business\setting_manager' );
        $tokens_class_name = lib::get_class_name( 'database\limesurvey\tokens' );
        $survey_class_name = lib::get_class_name( 'database\limesurvey\survey' );

        $old_tokens_sid = $tokens_class_name::get_sid();
        $old_survey_sid = $survey_class_name::get_sid();
        $tokens_class_name::set_sid( $db_script->sid );
        $survey_class_name::set_sid( $db_script->sid );

        $select = lib::create( 'database\select' );
        $select->add_column( 'id' );
        $select->add_column( 'participant_id' );
        $select->add_table_column( 'participant', 'uid' );
        $select->add_column( 'datetime' );
        $select->add_table_column( 'survey', 'id', 'survey_id' );
        $select->add_table_column( 'survey', 'submitdate IS NOT NULL', 'completed' );

        $modifier = lib::create( 'database\modifier' );
        $modifier->join( 'participant', 'supporting_script_check.participant_id', 'participant.id' );
        $modifier->where( 'supporting_script_check.script_id', '=', $db_script->id );
        static::join_survey_and_token_tables( $db_script->sid, $modifier, true );

        foreach( $supporting_script_check_class_name::select( $select, $modifier ) as $row )
        {
          $db_participant = lib::create( 'database\participant', $row['participant_id'] );
          if( is_null( $row['survey_id'] ) )
          { // there is no survey so remove the check
            $supporting_script_check_class_name::delete_check( $db_participant, $db_script );
          }
          else if( $row['completed'] )
          { // the survey is complete, process it
            $this->process_supporting_script_check( $db_participant, $db_script );
          }
          else
          { // check if the survey is out of date and delete it if it is
            if( $supporting_script_check_class_name::delete_check( $db_participant, $db_script, true ) )
            {
              $survey_class_name::get_unique_record( 'token', $row['uid'] )->delete();
              $tokens_class_name::get_unique_record( 'token', $row['uid'] )->delete();
            }
          }

          $total++;
        }

        $tokens_class_name::set_sid( $old_tokens_sid );
        $survey_class_name::set_sid( $old_survey_sid );
      }
    }

    return $total;
  }

  /**
   * Processes a participant's supporting script
   * Note that this method does nothing if the participant has not completed the supporting script
   * Note that this method is used for Limesurvey scripts only (not used for Pine)
   *
   * @param database\participant $db_participant
   * @param database\script $db_script
   * @access public
   */
  public function process_supporting_script_check( $db_participant, $db_script )
  {
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $supporting_script_check_class_name = lib::get_class_name( 'database\supporting_script_check' );

    if( !$db_script->supporting )
    {
      log::warning( sprintf(
        'Tried to process non-supporting script "%s" as a supporting script (request ignored).',
        $db_script->name
      ) );
    }
    else if( 'pine' == $db_script->get_type() )
    {
      log::warning( 'Cenozo does not yet support Pine-based supporting scripts.' );
    }
    else
    {
      $select = lib::create( 'database\select' );
      $select->from( 'participant' );
      $select->add_column( 'CONVERT_TZ( survey.submitdate, "Canada/Eastern", "UTC" )', 'datetime', false );

      $modifier = lib::create( 'database\modifier' );
      static::join_survey_and_token_tables( $db_script->sid, $modifier );
      $modifier->where( 'participant.id', '=', $db_participant->id );
      $modifier->where( 'survey.submitdate', '!=', NULL );

      $list = $participant_class_name::select( $select, $modifier );
      if( 0 < count( $list ) )
      {
        $script_results = current( $list );

        if( false !== strpos( strtolower( $db_script->name ), 'proxy initiation' ) )
          $this->process_proxy_initiation( $db_participant );

        // add finished event if required
        $db_script->add_finished_event_types( $db_participant );

        // delete the supporting script check
        $supporting_script_check_class_name::delete_check( $db_participant, $db_script );
      }
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
      'qnaire/name=Withdraw/response?modifier=%s&export=1',
      $util_class_name::json_encode( $modifier_obj )
    ) );

    // loop through the data and create a temporary table containing the option and delink details
    $participant_class_name::db()->execute(
      'CREATE TEMPORARY TABLE option_and_delink( '.
        'uid VARCHAR(45) NOT NULL, '.
        'option CHAR(6) NOT NULL, '.
        'delink TINYINT(1) NOT NULL, '.
        'PRIMARY KEY (uid) '.
      ')'
    );

    if( 0 < count( $data ) )
    {
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
        $insert_record[] = sprintf( '( "%s", "%s", %d )', $obj->uid, $option, $delink );
      }
      
      $participant_class_name::db()->execute( sprintf(
        'INSERT INTO option_and_delink VALUES %s',
        implode( ',', $insert_record )
      ) );
    }
  }
}
