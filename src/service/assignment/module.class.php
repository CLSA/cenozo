<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\assignment;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\site_restricted_participant_module
{
  /**
   * Extend parent method
   */
  public function validate()
  {
    parent::validate();

    if( 300 > $this->get_status()->get_code() )
    {
      $service_class_name = lib::get_class_name( 'service\service' );

      $session = lib::create( 'business\session' );
      $db_user = $session->get_user();
      $db_role = $session->get_role();
      $method = $this->get_method();
      $operation = $this->get_argument( 'operation', false );
      $data_array = $this->get_file_as_array();
      $db_assignment = $this->get_resource();

      // restrict by site
      $db_restrict_site = $this->get_restricted_site();
      if( !is_null( $db_restrict_site ) )
      {
        if( !is_null( $db_assignment ) &&
            $db_assignment->site_id &&
            $db_assignment->site_id != $db_restrict_site->id )
        {
          $this->get_status()->set_code( 403 );
          return;
        }
      }

      if( ( 'DELETE' == $method || ( 'PATCH' == $method && 'force_close' != $operation ) ) &&
          3 > $db_role->tier &&
          $db_assignment->user_id != $db_user->id )
      {
        // only admins can delete or modify assignments other than their own
          $this->get_status()->set_code( 403 );
      }
      else if( 'PATCH' == $method && ( 'close' == $operation || 'force_close' == $operation ) )
      {
        if( 0 < count( $data_array ) )
        {
          $this->set_data( 'Patch data must be empty when advancing or closing an assignment.' );
          $this->get_status()->set_code( 400 );
        }
        else if( !is_null( $db_assignment->end_datetime ) )
        {
          $this->set_data( 'Cannot close the assignment since it is already closed.' );
          $this->get_status()->set_code( 409 );
        }
        else
        {
          $this->db_participant = $db_assignment->get_interview()->get_participant();

          $has_open_phone_call = $db_assignment->has_open_phone_call();
          if( 'close' == $operation )
          {
            if( 0 < $has_open_phone_call )
            {
              $this->set_data( 'An assignment cannot be closed during an open call.' );
              $this->get_status()->set_code( 409 );
            }
          }
          else if( 'force_close' == $operation )
          {
            if( 2 > $db_role->tier ) $this->get_status()->set_code( 403 );
          }
        }
      }
      else if( 'POST' == $method )
      {
        // do not allow more than one open assignment
        if( $db_user->has_open_assignment() )
        {
          $this->set_data( 'Cannot create a new assignment since you already have one open.' );
          $this->get_status()->set_code( 409 );
        }
        else
        {
          if( is_array( $data_array ) && array_key_exists( 'participant_id', $data_array ) )
            $this->db_participant = lib::create( 'database\participant', $data_array['participant_id'] );
        }
      }
    }
  }

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    // restrict by site
    $db_restrict_site = $this->get_restricted_site();
    if( !is_null( $db_restrict_site ) ) $modifier->where( 'assignment.site_id', '=', $db_restrict_site->id );

    $modifier->join( 'interview', 'assignment.interview_id', 'interview.id' );

    if( $select->has_table_columns( 'user' ) )
      $modifier->left_join( 'user', 'assignment.user_id', 'user.id' );

    if( $select->has_table_columns( 'site' ) )
      $modifier->left_join( 'site', 'assignment.site_id', 'site.id' );

    if( $select->has_table_columns( 'participant' ) )
      $modifier->join( 'participant', 'interview.participant_id', 'participant.id' );

    if( $select->has_column( 'phone_call_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'assignment' );
      $join_sel->add_column( 'id', 'assignment_id' );
      $join_sel->add_column( 'IF( phone_call.id IS NULL, 0, COUNT( * ) )', 'phone_call_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->left_join( 'phone_call', 'assignment.id', 'phone_call.assignment_id' );
      $join_mod->group( 'assignment.id' );

      $modifier->join(
        sprintf( '( %s %s ) AS assignment_join_phone_call', $join_sel->get_sql(), $join_mod->get_sql() ),
        'assignment.id',
        'assignment_join_phone_call.assignment_id' );
      $select->add_table_column( 'assignment_join_phone_call', 'phone_call_count' );
    }

    // add the assignment's last call's status column
    if( $select->has_table_columns( 'last_phone_call' ) ||
        $select->has_column( 'call_active' ) ||
        $select->has_column( 'status' ) )
    {
      $modifier->join( 'assignment_last_phone_call',
        'assignment.id', 'assignment_last_phone_call.assignment_id' );
      $modifier->left_join( 'phone_call AS last_phone_call',
        'assignment_last_phone_call.phone_call_id', 'last_phone_call.id' );

      if( $select->has_column( 'status' ) ) $select->add_table_column( 'last_phone_call', 'status' );

      if( $select->has_column( 'call_active' ) )
        $select->add_table_column( 'last_phone_call',
          'last_phone_call.id IS NOT NULL AND last_phone_call.end_datetime IS NULL',
          'call_active', false, 'boolean' );
    }
  }

  /**
   * Extend parent method
   */
  public function pre_write( $record )
  {
    parent::pre_write( $record );

    $util_class_name = lib::get_class_name( 'util' );

    $now = $util_class_name::get_datetime_object();
    $operation = $this->get_argument( 'operation', false );

    if( 'POST' == $this->get_method() && 'open' == $operation )
    {
      $session = lib::create( 'business\session' );

      if( is_null( $this->db_participant ) )
        throw lib::create( 'exception\argument', 'db_participant', $db_participant, __METHOD__ );

      $db_interview = $this->db_participant->get_effective_interview();
      if( is_null( $db_interview->start_datetime ) )
      {
        $db_interview->start_datetime = $now;
        $db_interview->save();
      }

      $record->user_id = $session->get_user()->id;
      $record->role_id = $session->get_role()->id;
      $record->site_id = $session->get_site()->id;
      $record->interview_id = $db_interview->id;
      $record->start_datetime = $now;
    }
    else if( 'PATCH' == $this->get_method() && ( 'close' == $operation || 'force_close' == $operation ) )
    {
      $record->end_datetime = $now;
    }
  }

  /**
   * Extend parent method
   */
  public function post_write( $record )
  {
    parent::post_write( $record );

    $util_class_name = lib::get_class_name( 'util' );

    if( 'PATCH' == $this->get_method() )
    {
      $now = $util_class_name::get_datetime_object();
      $operation = $this->get_argument( 'operation', false );
      if( 'close' == $operation || 'force_close' == $operation )
      {
        if( 'force_close' == $operation )
        {
          // end any active phone calls
          $phone_call_mod = lib::create( 'database\modifier' );
          $phone_call_mod->where( 'phone_call.end_datetime', '=', NULL );
          foreach( $record->get_phone_call_object_list( $phone_call_mod ) as $db_phone_call )
          {
            $db_phone_call->end_datetime = $now;
            $db_phone_call->status = 'contacted';
            $db_phone_call->save();
            $db_phone_call->process_events();
          }
        }

        // delete the assignment if there are no phone calls, or run its post processing if there are
        if( 0 == $record->get_phone_call_count() ) $record->delete();
        else
        {
          $record->post_process( true );

          // mark the interview as complete if the survey is complete
          if( $this->is_survey_complete ) $record->get_interview()->complete();
        }
      }
    }
  }

  /**
   * A temporary variable used for caching
   * @var database\participant $db_participant
   * @access protected
   */
  protected $db_participant = NULL;

  /**
   * A temporary variable used for caching
   * Note that if this member is not used in extended classes then it will remain NULL, meaning no changes
   * will be made to an interview's completed status
   * @var boolean $is_survey_complete
   * @access protected
   */
  protected $is_survey_complete = NULL;

  /**
   * A temporary variable used for caching
   * @var integer $current_phone_id
   * @access protected
   */
  protected $current_phone_id = NULL;
}
