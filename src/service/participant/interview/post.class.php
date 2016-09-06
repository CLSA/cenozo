<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\participant\interview;
use cenozo\lib, cenozo\log;

class post extends \cenozo\service\post
{
  /**
   * Replace parent method
   */
  protected function validate()
  {
    $db_participant = $this->get_parent_record();

    // make sure the interview was created
    if( is_null( $this->get_leaf_record() ) )
    {
      $this->set_data( 'Cannot create interview since the participant is not eligible to be interviewed.' );
      $this->get_status()->set_code( 409 );
    }
    else
    {
      // make sure the participant doesn't already have an open interview
      $interview_mod = lib::create( 'database\modifier' );
      $interview_mod->where( 'end_datetime', '=', NULL );
      if( 0 < $db_participant->get_interview_count( $interview_mod ) )
      {
        $this->set_data( 'Cannot create interview since the participant already has an incomplete interview.' );
        $this->get_status()->set_code( 409 );
      }
    }
  }

  /**
   * We create a new interview by using the participant's get_effective_interview
   * method.
   */
  protected function create_resource( $index )
  {
    $util_class_name = lib::get_class_name( 'util' );

    $resource = null;
    if( 'interview' == $this->get_subject( $index ) )
    {
      $resource = $this->get_parent_record()->get_effective_interview( false );
      if( !is_null( $resource ) ) $resource->start_datetime = $util_class_name::get_datetime_object();
    }
    else
    {
      $resource = parent::create_resource( $index );
    }

    return $resource;
  }
}
