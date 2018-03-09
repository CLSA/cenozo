<?php
/**
 * interview.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * interview: record
 */
class interview extends \cenozo\database\record
{
  /** 
   * Override parent method
   */
  public static function get_record_from_identifier( $identifier )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $qnaire_class_name = lib::get_class_name( 'database\qnaire' );

    // convert qnaire_rank to qnaire_id
    if( !$util_class_name::string_matches_int( $identifier ) &&
        false === strpos( 'qnaire_rank=', $identifier ) )
    {
      // convert qnaire_rank to qnaire_id
      $regex = '/qnaire_rank=([0-9]+)/';
      $matches = array();
      if( preg_match( $regex, $identifier, $matches ) )
      {
        $db_qnaire = $qnaire_class_name::get_unique_record( 'rank', $matches[1] );
        if( !is_null( $db_qnaire ) )
          $identifier = preg_replace( $regex, sprintf( 'qnaire_id=%d', $db_qnaire->id ), $identifier );
      }
    }

    return parent::get_record_from_identifier( $identifier );
  }

  /**
   * Get the interview's last (most recent) assignment.
   * @return assignment
   * @access public
   */
  public function get_last_assignment()
  {
    // check the last key value
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to query interview with no primary key.' );
      return NULL;
    }

    $select = lib::create( 'database\select' );
    $select->from( 'interview_last_assignment' );
    $select->add_column( 'assignment_id' );
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'interview_id', '=', $this->id );

    $assignment_id = static::db()->get_one( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );
    return $assignment_id ? lib::create( 'database\assignment', $assignment_id ) : NULL;
  }

  /**
   * Performes all necessary steps when completing an interview.
   * 
   * This method encapsulates all processing required when an interview is completed.
   * If you wish to "force" the completion or uncompletion of an interview please use
   * the force_complete() and force_uncomplete() methods intead.
   * @param database\site $db_credit_site If null then the session's site is credited
   * @access public
   */
  public function complete( $db_credit_site = NULL )
  {
    $util_class_name = lib::get_class_name( 'util' );

    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to complete interview with no primary key.' );
      return;
    }

    if( !is_null( $this->end_datetime ) )
    {
      log::warning( sprintf( 'Tried to complete interview id %d which already has an end_datetime.', $this->id ) );
    }
    else
    {
      $now = $util_class_name::get_datetime_object();
      if( is_null( $db_credit_site ) ) $db_credit_site = lib::create( 'business\session' )->get_site();

      // update the record
      $this->end_datetime = $now;
      $this->site_id = $db_credit_site->id;
      $this->save();
    }
  }
}
