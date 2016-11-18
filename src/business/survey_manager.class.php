<?php
/**
 * survey_manager.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function __construct() {}

  /**
   * Writes all columns of a token for the given script and participant
   * 
   * This method will try and fill in all columns of a token row, with the exception of the token
   * column.  To set the token use database\limesurvey\tokens::determine_token_string() static method.
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\participant $db_participant
   * @access public
   */
  public function reverse_withdraw( $db_participant )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $consent_type_class_name = lib::get_class_name( 'database\consent_type' );
    $tokens_class_name = lib::get_class_name( 'database\limesurvey\tokens' );

    $withdraw_sid = $this->get_withdraw_sid();
    if( $withdraw_sid )
    {
      // the withdraw option will be null if the survey hasn't been submitted
      $option = $this->get_withdraw_option( $db_participant );
      if( !is_null( $option['choice'] ) )
      {
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

        if( 1 < $option['choice'] )
        {
          // make sure the most recent HIN access consent is not negative
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
   * Processes the withdraw script of a participant who has been fully withdrawn
   * Note that this method does nothing if the participant has not completed the withdraw script
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\participant $db_participant
   * @access public
   */
  public function process_withdraw( $db_participant )
  {
    $consent_type_class_name = lib::get_class_name( 'database\consent_type' );

    if( $this->get_withdraw_sid() )
    {
      // the withdraw option will be null if the survey hasn't been submitted
      $option = $this->get_withdraw_option( $db_participant );
      if( !is_null( $option['choice'] ) )
      {
        // Add consent participation verbal deny
        $db_consent_type = $consent_type_class_name::get_unique_record( 'name', 'participation' );
        $db_consent = lib::create( 'database\consent' );
        $db_consent->participant_id = $db_participant->id;
        $db_consent->consent_type_id = $db_consent_type->id;
        $db_consent->accept = false;
        $db_consent->written = false;
        $db_consent->datetime = $option['datetime'];
        $db_consent->note = 'Added as part of the withdraw process.';
        $db_consent->save();

        if( 1 < $option['choice'] )
        {
          // Add consent HIN access verbal deny
          $db_consent_type = $consent_type_class_name::get_unique_record( 'name', 'HIN access' );
          $db_consent = lib::create( 'database\consent' );
          $db_consent->participant_id = $db_participant->id;
          $db_consent->consent_type_id = $db_consent_type->id;
          $db_consent->accept = false;
          $db_consent->written = false;
          $db_consent->datetime = $option['datetime'];
          $db_consent->note = 'Added as part of the withdraw process.';
          $db_consent->save();

          if( 2 < $option['choice'] ) $db_participant->delink = true;
        }

        $db_participant->check_withdraw = NULL;
        $db_participant->save();
      }
    }
  }

  /**
   * Gets the participant's withdraw option (may be null if the participant hasn't withdrawn)
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\participant $db_participant
   * @access protected
   */
  protected function get_withdraw_option( $db_participant )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $tokens_class_name = lib::get_class_name( 'database\limesurvey\tokens' );

    if( !array_key_exists( $db_participant->uid, $this->withdraw_option_list ) )
    {
      $option = array( 'choice' => NULL, 'datetime' => NULL );

      $withdraw_sid = $this->get_withdraw_sid();
      if( $withdraw_sid )
      {
        // set the SID for the the survey and tokens records
        $old_tokens_sid = $tokens_class_name::get_sid();
        $tokens_class_name::set_sid( $withdraw_sid );

        $db_tokens = NULL;
        $db_survey = NULL;
        $tokens_mod = lib::create( 'database\modifier' );
        $tokens_class_name::where_token( $tokens_mod, $db_participant, false );
        $tokens_mod->order_desc( 'tid' );
        foreach( $tokens_class_name::select_objects( $tokens_mod ) as $db_tokens )
        {
          $survey_list = $db_tokens->get_survey_list();
          if( 0 < count( $survey_list ) ) $db_survey = current( $survey_list );
          if( !is_null( $survey_list ) ) break;
        }

        if( !is_null( $db_tokens ) && !is_null( $db_survey ) )
        {
          if( !is_null( $db_survey->submitdate ) )
          {
            // determine the UTC survey submit datetime
            $datetime_obj = $util_class_name::get_datetime_object( $db_survey->submitdate );
            $tz = new \DateTimeZone( date_default_timezone_get() );
            $offset = $tz->getOffset( $datetime_obj );
            $interval = new \DateInterval( sprintf( 'PT%dS', abs( $offset ) ) );
            if( 0 > $offset ) $datetime_obj->add( $interval );
            else $datetime_obj->sub( $interval );
            $option['datetime'] = $datetime_obj;

            // figure out which token attributes are which
            $attributes = array();
            $db_surveys = lib::create( 'database\limesurvey\surveys', $withdraw_sid );
            foreach( $db_surveys->get_token_attribute_names() as $key => $value )
              $attributes[$key] = $db_tokens->$key;

            // get the code for the def and opt responses
            $code = 0 < $attributes['attribute_1'] ? 'HIN' : 'NO_HIN';
            $code .= 0 < $attributes['attribute_2'] ? '_SAMP' : '_NO_SAMP';

            $response = array();
            $response['start'] = $db_survey->get_response( 'WTD_START' );
            $response['def'] = $db_survey->get_response( 'WTD_DEF_'.$code );
            $response['opt'] = $db_survey->get_response( 'WTD_OPT_'.$code );

            // the default option was applied if...
            if( 'REFUSED' == $response['start'] ||
                'YES' == $response['def'] ||
                'REFUSED' == $response['def'] ||
                'REFUSED' == $response['opt'] )
            {
              $option['choice'] = 1;
            }
            else
            {
              $option['choice'] = 1 === preg_match( '/^OPTION([123])$/', $response['opt'], $matches )
                                ? $matches[1] : NULL;
            }
          }
        }

        $tokens_class_name::set_sid( $old_tokens_sid );
      }

      $this->withdraw_option_list[$db_participant->uid] = $option;
    }

    return $this->withdraw_option_list[$db_participant->uid];
  }

  /**
   * Returns the survey id of the withdraw script
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function get_withdraw_sid()
  {
    $script_class_name = lib::get_class_name( 'database\script' );

    if( is_null( $this->withdraw_sid ) )
    {
      $script_mod = lib::create( 'database\modifier' );
      $script_mod->where( 'withdraw', '=', true );
      $script_sel = lib::create( 'database\select' );
      $script_sel->from( 'script' );
      $script_sel->add_column( 'sid' );
      $sid_list = $script_class_name::select( $script_sel, $script_mod );
      $this->withdraw_sid = 0 < count( $sid_list ) ? $sid_list[0]['sid'] : 0;
    }

    return $this->withdraw_sid;
  }

  /**
   * Adds the needed changes to a select and modifier object to get a participant's withdraw option
   * 
   * This method assumes that the participant table has already been made part of the select/modifier
   * pair.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\select $select
   * @param database\modifier $modifier
   * @param string $alias What alias to use for the column
   * @access public
   */
  public function add_withdraw_option_column( $select, $modifier, $alias = 'option', $group = false )
  {
    $script_class_name = lib::get_class_name( 'database\script' );
    $tokens_class_name = lib::get_class_name( 'database\limesurvey\tokens' );
    $survey_class_name = lib::get_class_name( 'database\limesurvey\survey' );

    // find the withdraw script's SID
    $script_sel = lib::create( 'database\select' );
    $script_sel->add_column( 'sid' );
    $script_mod = lib::create( 'database\modifier' );
    $script_mod->where( 'withdraw', '=', true );
    $script_list = $script_class_name::select( $script_sel, $script_mod );
    if( 0 < count( $script_list ) )
    {
      $sid = $script_list[0]['sid'];
      $old_tokens_sid = $tokens_class_name::get_sid();
      $old_survey_sid = $survey_class_name::get_sid();
      $tokens_class_name::set_sid( $sid );
      $survey_class_name::set_sid( $sid );
      $database_name = lib::create( 'business\session' )->get_survey_database()->get_name();

      $modifier->join(
        sprintf( '%s.%s', $database_name, $tokens_class_name::get_table_name() ),
        'participant.uid',
        'tokens.token',
        '',
        'tokens'
      );
      $modifier->join(
        sprintf( '%s.%s', $database_name, $survey_class_name::get_table_name() ),
        'participant.uid',
        'survey.token',
        '',
        'survey'
      );

      // get the survey column names for various question codes
      $start_column_name = $survey_class_name::get_column_name_for_question_code( 'WTD_START' );
      $hin_samp_def_column_name =
        $survey_class_name::get_column_name_for_question_code( 'WTD_DEF_HIN_SAMP' );
      $hin_no_samp_def_column_name =
        $survey_class_name::get_column_name_for_question_code( 'WTD_DEF_HIN_NO_SAMP' );
      $no_hin_samp_def_column_name =
        $survey_class_name::get_column_name_for_question_code( 'WTD_DEF_NO_HIN_SAMP' );
      $no_hin_no_samp_def_column_name =
        $survey_class_name::get_column_name_for_question_code( 'WTD_DEF_NO_HIN_NO_SAMP' );
      $hin_samp_opt_column_name =
        $survey_class_name::get_column_name_for_question_code( 'WTD_OPT_HIN_SAMP' );
      $hin_no_samp_opt_column_name =
        $survey_class_name::get_column_name_for_question_code( 'WTD_OPT_HIN_NO_SAMP' );
      $no_hin_samp_opt_column_name =
        $survey_class_name::get_column_name_for_question_code( 'WTD_OPT_NO_HIN_SAMP' );
      $no_hin_no_samp_opt_column_name =
        $survey_class_name::get_column_name_for_question_code( 'WTD_OPT_NO_HIN_NO_SAMP' );

      $column = sprintf(
        'IF('."\n".
        '  %s = "REFUSED",'."\n".
        '  1,'."\n".
        '  IF('."\n".
        '    tokens.attribute_1,'."\n".
        '    IF('."\n".
        '      tokens.attribute_2,'."\n".
        '      IF( %s = "YES" OR %s = "REFUSED" OR %s = "REFUSED", 1, COALESCE( SUBSTRING( %s, 7 ), 1 ) ),'."\n".
        '      IF( %s = "YES" OR %s = "REFUSED" OR %s = "REFUSED", 1, COALESCE( SUBSTRING( %s, 7 ), 1 ) )'."\n".
        '    ),'."\n".
        '    IF('."\n".
        '      tokens.attribute_2,'."\n".
        '      IF( %s = "YES" OR %s = "REFUSED" OR %s = "REFUSED", 1, COALESCE( SUBSTRING( %s, 7 ), 1 ) ),'."\n".
        '      IF( %s = "YES" OR %s = "REFUSED" OR %s = "REFUSED", 1, COALESCE( SUBSTRING( %s, 7 ), 1 ) )'."\n".
        '    )'."\n".
        '  )'."\n".
        ')'."\n",
        $start_column_name,
        $hin_samp_def_column_name,
        $hin_samp_def_column_name,
        $hin_samp_opt_column_name,
        $hin_samp_opt_column_name,
        $hin_no_samp_def_column_name,
        $hin_no_samp_def_column_name,
        $hin_no_samp_opt_column_name,
        $hin_no_samp_opt_column_name,
        $no_hin_samp_def_column_name,
        $no_hin_samp_def_column_name,
        $no_hin_samp_opt_column_name,
        $no_hin_samp_opt_column_name,
        $no_hin_no_samp_def_column_name,
        $no_hin_no_samp_def_column_name,
        $no_hin_no_samp_opt_column_name,
        $no_hin_no_samp_opt_column_name
      );

      $select->add_column( $column, $alias, false );
      if( $group ) $modifier->group( $column );

      $tokens_class_name::set_sid( $old_tokens_sid );
      $survey_class_name::set_sid( $old_survey_sid );
    }
  }

  /**
   * A cache of the withdraw SID
   * @var integer
   * @access private
   */
  private $withdraw_sid = NULL;

  /**
   * A cache of participant withdraw options
   * @var array( uid => array( option => int, datetime => DateTime ) )
   * @access private
   */
  private $withdraw_option_list = array();
}
