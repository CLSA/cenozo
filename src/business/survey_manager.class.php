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
   * Internal method to handle the withdraw script
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\participant $db_participant
   * @access private
   */
  private function process_withdraw( $db_participant )
  {
    /* TODO: rewrite
    $tokens_class_name = lib::get_class_name( 'database\limesurvey\tokens' );

    $data_manager = lib::create( 'business\data_manager' );
    $withdraw_manager = lib::create( 'business\withdraw_manager' );

    // let the tokens record class know which SID we are dealing with by checking if
    // there is a source-specific survey for the participant, and if not falling back
    // on the default withdraw survey
    $withdraw_sid = $withdraw_manager->get_withdraw_sid( $db_participant );
    if( is_null( $withdraw_sid ) )
      throw lib::create( 'exception\runtime',
        sprintf( 'Trying to withdraw participant %s without a withdraw survey.',
                 $db_participant->uid ),
        __METHOD__ );
    $db_surveys = lib::create( 'database\limesurvey\surveys', $withdraw_sid );

    $old_sid = tokens_class_name::get_sid();
    $tokens_class_name::set_sid( $withdraw_sid );
    $token = $db_participant->uid;
    $tokens_mod = lib::create( 'database\modifier' );
    $tokens_mod->where( 'token', '=', $token );
    $db_tokens = current( $tokens_class_name::select_objects( $tokens_mod ) );

    if( false === $db_tokens )
    { // token not found, create it
      $db_tokens = lib::create( 'database\limesurvey\tokens' );
      $db_tokens->token = $token;
      $db_tokens->firstname = $db_participant->honorific.' '.$db_participant->first_name;
      $db_tokens->lastname = $db_participant->last_name;
      $db_tokens->email = $db_participant->email;

      if( 0 < strlen( $db_participant->other_name ) )
        $db_tokens->firstname .= sprintf( ' (%s)', $db_participant->other_name );

      // fill in the attributes
      foreach( $db_surveys->get_token_attribute_names() as $key => $value )
        $db_tokens->$key = 0 === strpos( $value, 'participant\.' )
                           ? $data_manager->get_participant_value( $db_participant, $value )
                           : $data_manager->get_value( $value );
      $db_tokens->save();
    }
    else if( 'N' == $db_tokens->completed )
    {
      $this->current_sid = $withdraw_sid;
      $this->current_token = $token;
    }
    else // token is complete, store the survey results
    {
      $withdraw_manager->process( $db_participant );
    }

    $tokens_class_name::set_sid( $old_sid );
    */
  }
}
