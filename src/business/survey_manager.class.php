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
   * @param database\script $db_script The script that the token belongs to
   * @param database\participant $db_participant The participant that the token belongs to
   * @param database\tokens $db_tokens The token to populate (if null a new one will be created)
   * @return database\tokens
   * @access protected
   */
  public function populate_token( $db_script, $db_participant, $db_tokens = NULL )
  {
    $data_manager = lib::create( 'business\data_manager' );

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
          $db_tokens->$key = 0 === strpos( $value, 'participant.' )
                           ? $data_manager->get_participant_value( $db_participant, $value )
                           : $data_manager->get_value( $value );
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
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $consent_type_class_name = lib::get_class_name( 'database\consent_type' );
    $tokens_class_name = lib::get_class_name( 'database\limesurvey\tokens' );

    $withdraw_sid = $this->get_withdraw_sid();
    if( $withdraw_sid )
    {
      $withdraw_sel = lib::create( 'database\select' );
      $withdraw_sel->from( 'participant' );
      $withdraw_mod = lib::create( 'database\modifier' );
      $withdraw_mod->where( 'participant.id', '=', $db_participant->id );
      $this->add_withdraw_option_column( $withdraw_sel, $withdraw_mod );
      $list = $participant_class_name::select( $withdraw_sel, $withdraw_mod );
      if( 0 < count( $list ) )
      {
        $withdraw = current( $list );
        $old_tokens_sid = $tokens_class_name::get_sid();
        $tokens_class_name::set_sid( $withdraw_sid );

        // delete the token
        $tokens_mod = lib::create( 'database\modifier' );
        $tokens_mod->where( 'token', '=', $db_participant->uid );
        foreach( $tokens_class_name::select_objects( $tokens_mod ) as $db_tokens )
        {
          foreach( $db_tokens->get_survey_list() as $db_survey ) $db_survey->delete();
          $db_tokens->delete();
        }

        $tokens_class_name::set_sid( $old_tokens_sid );

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

        // Make sure the most recent HIN access consent is not negative if options 2 or 3 were selected
        if( 2 == $withdraw['option'] || 3 == $withdraw['option'] )
        {
          $db_consent_type = $consent_type_class_name::get_unique_record( 'name', 'HIN access' );

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
        }

        $db_participant->delink = false;
        $db_participant->save();
      }
    }
  }

  /**
   * Resolves the supporting status of all participants who need a supporting script's status checked
   * 
   * @param database\script $db_script The script to process
   */
  public function process_all_supporting_script_checks( $db_script )
  {
    $total = 0;

    if( !$db_script->supporting )
    {
      log::warning( sprintf(
        'Tried to process non-supporting script "%s" as a supporting script (request ignored).',
        $db_script->name
      ) );
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
      $tokens_class_name::set_sid( $withdraw_sid );
      $survey_class_name::set_sid( $withdraw_sid );

      $select = lib::create( 'database\select' );
      $select->add_column( 'id' );
      $select->add_column( 'participant_id' );
      $select->add_table_column( 'participant', 'uid' );
      $select->add_column( 'datetime' );
      $select->add_table_column( 'survey', 'id', 'survey_id' );
      $select->add_table_column( 'survey', 'submitdate IS NOT NULL', 'completed' );

      $modifier = lib::create( 'database\modifier' );
      static::join_survey_and_token_tables( $db_script->sid, $modifier );

      foreach( $supporting_script_check::select( $select, $modifier ) as $row )
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

    return $total;
  }

  /**
   * Processes a participant's supporting script
   * Note that this method does nothing if the participant has not completed the supporting script
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

        // The withdraw script has additional processing
        if( false !== strpos( strtolower( $db_script->name ), 'withdraw' ) ) $this->process_withdraw( $db_participant );

        // add finished event if required
        $db_script->add_finished_event_types( $db_participant );

        // delete the supporting script check
        $supporting_script_check_class_name::delete_check( $db_participant, $db_script );
      }
    }
  }

  /**
   * Processes the withdraw script of a participant who has been fully withdrawn
   * Note that this method does nothing if the participant has not completed the withdraw script
   * @param database\participant $db_participant
   * @access public
   */
  public function process_withdraw( $db_participant )
  {
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $consent_type_class_name = lib::get_class_name( 'database\consent_type' );

    if( $this->get_withdraw_sid() )
    {
      $withdraw_sel = lib::create( 'database\select' );
      $withdraw_sel->from( 'participant' );
      $withdraw_sel->add_column( 'CONVERT_TZ( survey.submitdate, "Canada/Eastern", "UTC" )', 'datetime', false );
      $withdraw_mod = lib::create( 'database\modifier' );
      $withdraw_mod->where( 'participant.id', '=', $db_participant->id );
      $withdraw_mod->where( 'survey.submitdate', '!=', NULL );
      $this->add_withdraw_option_column( $withdraw_sel, $withdraw_mod );
      $this->add_withdraw_delink_column( $withdraw_sel, $withdraw_mod );
      $list = $participant_class_name::select( $withdraw_sel, $withdraw_mod );
      if( 0 < count( $list ) )
      {
        $withdraw = current( $list );

        // Add consent participation verbal deny
        $db_consent_type = $consent_type_class_name::get_unique_record( 'name', 'participation' );
        $db_consent = lib::create( 'database\consent' );
        $db_consent->participant_id = $db_participant->id;
        $db_consent->consent_type_id = $db_consent_type->id;
        $db_consent->accept = false;
        $db_consent->written = false;
        $db_consent->datetime = $withdraw['datetime'];
        $db_consent->note = 'Added as part of the withdraw process.';
        $db_consent->save();

        // Add consent HIN access verbal deny if options 2 or 3 were selected
        if( 2 == $withdraw['option'] || 3 == $withdraw['option'] )
        {
          $db_consent_type = $consent_type_class_name::get_unique_record( 'name', 'HIN access' );

          // Only add a negative consent if the last consent exists and is positive
          $db_last_consent = $db_participant->get_last_consent( $db_last_consent_type );
          if( !is_null( $db_last_consent ) && $db_last_consent->accept )
          {
            $db_consent = lib::create( 'database\consent' );
            $db_consent->participant_id = $db_participant->id;
            $db_consent->consent_type_id = $db_consent_type->id;
            $db_consent->accept = false;
            $db_consent->written = false;
            $db_consent->datetime = $withdraw['datetime'];
            $db_consent->note = 'Added as part of the withdraw process.';
            $db_consent->save();
          }
        }

        if( $withdraw['delink'] )
        {
          $db_participant->delink = true;
          $db_participant->save();
        }
      }
    }
  }

  /**
   * Returns the withdraw script
   * @access public
   */
  public function get_withdraw_script()
  {
    $script_class_name = lib::get_class_name( 'database\script' );

    if( is_null( $this->db_withdraw_script ) )
    {
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'name', 'LIKE', '%withdraw%' );
      $script_list = $script_class_name::select_objects( $modifier );
      $this->db_withdraw_script = current( $script_list );
    }

    return $this->db_withdraw_script;
  }

  /**
   * Returns the survey id of the withdraw script
   * @access public
   */
  public function get_withdraw_sid()
  {
    $db_withdraw_script = $this->get_withdraw_script();
    return $db_withdraw_script ? $db_withdraw_script->sid : 0;
  }

  /**
   * Adds the needed changes to a select and modifier object to get a participant's withdraw option
   * 
   * This method assumes that the participant table has already been made part of the select/modifier
   * pair.
   * @param database\select $select
   * @param database\modifier $modifier
   * @param string $alias What alias to use for the column
   * @access public
   */
  public function add_withdraw_option_column( $select, $modifier, $alias = 'option', $group = false )
  {
    $withdraw_sid = $this->get_withdraw_sid();
    if( $withdraw_sid )
    {
      static::join_survey_and_token_tables( $withdraw_sid, $modifier );
      $column_name_list = $this->get_withdraw_column_name_list();

      $column = sprintf(
        'IF('."\n".
        '  %s = "REFUSED" OR'."\n".
        '  %s = "REFUSED" OR %s = "REFUSED" OR %s = "REFUSED" OR %s = "REFUSED" OR'."\n".
        '  %s = "YES" OR %s = "YES" OR %s = "YES" OR %s = "YES" OR'."\n".
        '  %s = "REFUSED" OR %s = "REFUSED" OR %s = "REFUSED" OR %s = "REFUSED",'."\n".
        '  "default",'."\n".
        '  IF('."\n".
        '    %s = "YES" OR %s = "YES" OR %s = "YES" OR %s = "YES",'."\n".
        '    1,'."\n".
        '    COALESCE('."\n".
        '      SUBSTRING('."\n".
        '        IF( 0 < tokens.attribute_1,'."\n".
        '          IF( 0 < tokens.attribute_2, %s, %s ),'."\n".
        '          IF( 0 < tokens.attribute_2, %s, %s )'."\n".
        '        ), 7'."\n".
        '      ), 1'."\n".
        '    )'."\n".
        '  )'."\n".
        ')',
        $column_name_list['start'],

        $column_name_list['hin_samp_def'],
        $column_name_list['hin_no_samp_def'],
        $column_name_list['no_hin_samp_def'],
        $column_name_list['no_hin_no_samp_def'],

        $column_name_list['hin_samp_def'],
        $column_name_list['hin_no_samp_def'],
        $column_name_list['no_hin_samp_def'],
        $column_name_list['no_hin_no_samp_def'],

        $column_name_list['hin_samp_opt'],
        $column_name_list['hin_no_samp_opt'],
        $column_name_list['no_hin_samp_opt'],
        $column_name_list['no_hin_no_samp_opt'],

        $column_name_list['hin_samp_def'],
        $column_name_list['hin_no_samp_def'],
        $column_name_list['no_hin_samp_def'],
        $column_name_list['no_hin_no_samp_def'],

        $column_name_list['hin_samp_opt'],
        $column_name_list['hin_no_samp_opt'],
        $column_name_list['no_hin_samp_opt'],
        $column_name_list['no_hin_no_samp_opt']
      );

      $select->add_column( $column, $alias, false );
      if( $group ) $modifier->group( $column );
    }
  }

  /**
   * Adds the needed changes to a select and modifier object to get a participant's withdraw delink state
   * 
   * This method assumes that the participant table has already been made part of the select/modifier
   * pair.
   * @param database\select $select
   * @param database\modifier $modifier
   * @param string $alias What alias to use for the column
   * @access public
   */
  public function add_withdraw_delink_column( $select, $modifier, $alias = 'delink', $group = false )
  {
    $withdraw_sid = $this->get_withdraw_sid();
    if( $withdraw_sid )
    {
      static::join_survey_and_token_tables( $withdraw_sid, $modifier );
      $column_name_list = $this->get_withdraw_column_name_list();

      $column = sprintf(
        'IF('."\n".
        '  %s = "REFUSED" OR'."\n".
        '  %s = "REFUSED" OR %s = "REFUSED" OR'."\n".
        '  %s = "REFUSED" OR %s = "REFUSED" OR'."\n".
        '  %s = "REFUSED" OR %s = "REFUSED" OR'."\n".
        '  %s = "REFUSED" OR %s = "REFUSED",'."\n".
        '  false,'."\n".
        '  IF('."\n".
        '    %s = "YES" OR %s = "YES" OR %s = "YES" OR %s = "YES",'."\n".
        '    false,'."\n".
        '    IF('."\n".
        '      COALESCE('."\n".
        '        SUBSTRING('."\n".
        '          IF( 0 < tokens.attribute_1,'."\n".
        '            IF( 0 < tokens.attribute_2, %s, %s ),'."\n".
        '            IF( 0 < tokens.attribute_2, %s, %s )'."\n".
        '          ), 7'."\n".
        '        ), 1'."\n".
        '      ) = 1 OR ('."\n".
        '        COALESCE('."\n".
        '          SUBSTRING('."\n".
        '            IF( 0 < tokens.attribute_1,'."\n".
        '              IF( 0 < tokens.attribute_2, %s, %s ),'."\n".
        '              IF( 0 < tokens.attribute_2, %s, %s )'."\n".
        '            ), 7'."\n".
        '          ), 1'."\n".
        '        ) = 2 AND 0 < tokens.attribute_1'."\n".
        '      ),'."\n".
        '      false,'."\n".
        '      true'."\n".
        '    )'."\n".
        '  )'."\n".
        ')',
        $column_name_list['start'],

        $column_name_list['hin_samp_def'],
        $column_name_list['hin_no_samp_def'],
        $column_name_list['no_hin_samp_def'],
        $column_name_list['no_hin_no_samp_def'],

        $column_name_list['hin_samp_opt'],
        $column_name_list['hin_no_samp_opt'],
        $column_name_list['no_hin_samp_opt'],
        $column_name_list['no_hin_no_samp_opt'],

        $column_name_list['hin_samp_def'],
        $column_name_list['hin_no_samp_def'],
        $column_name_list['no_hin_samp_def'],
        $column_name_list['no_hin_no_samp_def'],

        $column_name_list['hin_samp_opt'],
        $column_name_list['hin_no_samp_opt'],
        $column_name_list['no_hin_samp_opt'],
        $column_name_list['no_hin_no_samp_opt'],

        $column_name_list['hin_samp_opt'],
        $column_name_list['hin_no_samp_opt'],
        $column_name_list['no_hin_samp_opt'],
        $column_name_list['no_hin_no_samp_opt']
      );

      $select->add_column( $column, $alias, false );
      if( $group ) $modifier->group( $column );
    }
  }

  /**
   * Returns a list of withdraw column names
   * @access public
   */
  protected function get_withdraw_column_name_list()
  {
    // create the list if it doesn't already exist
    if( is_null( $this->withdraw_column_name_list ) )
    {
      $tokens_class_name = lib::get_class_name( 'database\limesurvey\tokens' );
      $survey_class_name = lib::get_class_name( 'database\limesurvey\survey' );

      $withdraw_sid = $this->get_withdraw_sid();
      if( $withdraw_sid )
      {
        $old_tokens_sid = $tokens_class_name::get_sid();
        $old_survey_sid = $survey_class_name::get_sid();
        $tokens_class_name::set_sid( $withdraw_sid );
        $survey_class_name::set_sid( $withdraw_sid );

        // get the survey column names for various question codes
        $this->withdraw_column_name_list = array(
          'start' => $survey_class_name::get_column_name_for_question_code( 'WTD_START' ),
          'hin_samp_def' => $survey_class_name::get_column_name_for_question_code( 'WTD_DEF_HIN_SAMP' ),
          'hin_no_samp_def' => $survey_class_name::get_column_name_for_question_code( 'WTD_DEF_HIN_NO_SAMP' ),
          'no_hin_samp_def' => $survey_class_name::get_column_name_for_question_code( 'WTD_DEF_NO_HIN_SAMP' ),
          'no_hin_no_samp_def' =>
            $survey_class_name::get_column_name_for_question_code( 'WTD_DEF_NO_HIN_NO_SAMP' ),
          'hin_samp_opt' => $survey_class_name::get_column_name_for_question_code( 'WTD_OPT_HIN_SAMP' ),
          'hin_no_samp_opt' => $survey_class_name::get_column_name_for_question_code( 'WTD_OPT_HIN_NO_SAMP' ),
          'no_hin_samp_opt' => $survey_class_name::get_column_name_for_question_code( 'WTD_OPT_NO_HIN_SAMP' ),
          'no_hin_no_samp_opt' =>
            $survey_class_name::get_column_name_for_question_code( 'WTD_OPT_NO_HIN_NO_SAMP' )
        );

        $tokens_class_name::set_sid( $old_tokens_sid );
        $survey_class_name::set_sid( $old_survey_sid );
      }
    }

    return $this->withdraw_column_name_list;
  }

  /**
   * Convenience method that processes all withdraw scripts
   */
  public function process_pending_withdraw()
  {
    $db_withdraw_script = $this->get_withdraw_script();
    return $db_withdraw_script ? $this->process_all_supporting_script_checks( $db_withdraw_script ) : 0;
  }

  /**
   * Joins the given modifier to survey and token tables
   * 
   * @param integer $sid The limesurvey SID (survey ID) of the survey to link to
   * @param database\modifier $modifier
   * @access public
   */
  protected static function join_survey_and_token_tables( $sid, $modifier )
  {
    $tokens_class_name = lib::get_class_name( 'database\limesurvey\tokens' );
    $survey_class_name = lib::get_class_name( 'database\limesurvey\survey' );

    $old_tokens_sid = $tokens_class_name::get_sid();
    $old_survey_sid = $survey_class_name::get_sid();
    $tokens_class_name::set_sid( $sid );
    $survey_class_name::set_sid( $sid );
    $database_name = lib::create( 'business\session' )->get_survey_database()->get_name();

    if( !$modifier->has_join( 'tokens' ) )
    {
      $modifier->join(
        sprintf( '%s.%s', $database_name, $tokens_class_name::get_table_name() ),
        'participant.uid',
        'tokens.token',
        '',
        'tokens'
      );
    }

    if( !$modifier->has_join( 'survey' ) )
    {
      $modifier->join(
        sprintf( '%s.%s', $database_name, $survey_class_name::get_table_name() ),
        'tokens.token',
        'survey.token',
        '',
        'survey'
      );
    }

    $tokens_class_name::set_sid( $old_tokens_sid );
    $survey_class_name::set_sid( $old_survey_sid );
  }

  /**
   * A cache of the withdraw script
   * @var database\script
   * @access private
   */
  private $db_withdraw_script = NULL;

  /**
   * A cache of withdraw survey column names
   * @var array( code => name )
   * @access private
   */
  private $withdraw_column_name_list = NULL;
}
