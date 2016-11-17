<?php
/**
 * withdraw_mailout.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\business\report;
use cenozo\lib, cenozo\log;

/**
 * Email report
 */
class withdraw_mailout extends \cenozo\business\report\base_report
{
  /**
   * Build the report
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function build()
  {
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $event_type_class_name = lib::get_class_name( 'database\event_type' );
    $script_class_name = lib::get_class_name( 'database\script' );
    $survey_class_name = lib::get_class_name( 'database\limesurvey\survey' );
    $tokens_class_name = lib::get_class_name( 'database\limesurvey\tokens' );

    $db_withdraw_mailed_event_type = $event_type_class_name::get_unique_record( 'name', 'withdraw mailed' );

    $select = lib::create( 'database\select' );
    $select->from( 'participant' );
    $select->add_column( 'uid', 'UID' );
    $select->add_column( 'language.name', 'Language', false );
    $select->add_column( 'honorific', 'Honorific' );
    $select->add_column( 'first_name', 'First Name' );
    $select->add_column( 'last_name', 'Last Name' );
    $select->add_column( 'address.address1', 'Address1', false );
    $select->add_column( 'address.address2', 'Address2', false );
    $select->add_column( 'address.city', 'City', false );
    $select->add_column( 'region.name', 'Province/State', false );
    $select->add_column( 'address.postcode', 'Postcode', false );
    $select->add_column( 'region.country', 'Country', false );

    $modifier = lib::create( 'database\modifier' );
    $modifier->join( 'language', 'participant.language_id', 'language.id' );
    $modifier->join( 'participant_first_address', 'participant.id', 'participant_first_address.participant_id' );
    $modifier->join( 'address', 'participant_first_address.address_id', 'address.id' );
    $modifier->join( 'region', 'address.region_id', 'region.id' );

    // make sure the current consent is negative
    $modifier->join( 'participant_last_consent', 'participant.id', 'participant_last_consent.participant_id' );
    $modifier->join( 'consent_type', 'participant_last_consent.consent_type_id', 'consent_type.id' );
    $modifier->join( 'consent', 'participant_last_consent.consent_id', 'consent.id' );
    $modifier->where( 'consent_type.name', '=', 'participation' );
    $modifier->where( 'consent.accept', '=', false );

    // make sure they haven't been mailed to already
    $join_mod = lib::create( 'database\modifier' );
    $join_mod->where( 'participant.id', '=', 'event.participant_id', false );
    $join_mod->where( 'event.event_type_id', '=', $db_withdraw_mailed_event_type->id );
    $modifier->join_modifier( 'event', $join_mod, 'left' );
    $modifier->where( 'event.id', '=', NULL );

    // link to the withdraw script if one is in use
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
        static::$option_sql,
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

      $select->add_column( $column, 'Option', false );

      $tokens_class_name::set_sid( $old_tokens_sid );
      $survey_class_name::set_sid( $old_survey_sid );
    }

    // set up requirements
    $this->apply_restrictions( $modifier );

    $this->add_table_from_select( NULL, $participant_class_name::select( $select, $modifier ) );
  }

  private static $option_sql = <<<'SQL'
IF(
  %s = "REFUSED", -- start
  1,
  IF(
    tokens.attribute_1,
    IF(
      tokens.attribute_2,
      -- hin-samp (def, def, opt, opt)
      IF( %s = "YES" OR %s = "REFUSED" OR %s = "REFUSED", 1, COALESCE( SUBSTRING( %s, 7 ), 1 ) ),
      -- hin-no-samp (def, def, opt, opt)
      IF( %s = "YES" OR %s = "REFUSED" OR %s = "REFUSED", 1, COALESCE( SUBSTRING( %s, 7 ), 1 ) )
    ),
    IF(
      tokens.attribute_2,
      -- no-hin-samp (def, def, opt, opt)
      IF( %s = "YES" OR %s = "REFUSED" OR %s = "REFUSED", 1, COALESCE( SUBSTRING( %s, 7 ), 1 ) ),
      -- no-hin-no-samp (def, def, opt, opt)
      IF( %s = "YES" OR %s = "REFUSED" OR %s = "REFUSED", 1, COALESCE( SUBSTRING( %s, 7 ), 1 ) )
    )
  )
)
SQL;
}
