<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\application;
use cenozo\lib, cenozo\log;

/**
 * Extends the base class query class
 */
class read_modification extends \cenozo\base_object
{
  /**
   * Applies changes to select and modifier objects for all queries which have this
   * subject as its leaf-application
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\select $select The query's select object to modify
   * @param database\modifier $modifier The query's modifier object to modify
   * @access public
   * @static
   */
  public static function apply( $select, $modifier )
  {
    /*
      TODONEXT:
        convert raw sql to select/modifier
        restrict data by !role.all_sites
    */

    // add the total number of participants
    if( $select->has_table_column( '', 'participant_count' ) )
    {
      $application_join_participant =
        'SELECT application.id AS application_id, COUNT(*) AS participant_count '.
        'FROM application '.
        'LEFT JOIN application_has_participant '.
        'ON application.id = application_has_participant.application_id '.
        'WHERE application_has_participant.participant_id IS NULL '.
        'OR datetime IS NOT NULL '.
        'GROUP BY application_id';
      $modifier->left_join(
        sprintf( '( %s ) AS application_join_participant', $application_join_participant ),
        'application.id',
        'application_join_participant.application_id' );
      $select->add_column( 'IF( application.release_based, '.
                               'IFNULL( participant_count, 0 ), '.
                               '( SELECT COUNT(*) FROM participant ) '.
                           ')', 'participant_count', false );
    }

    // add the total number of sites
    if( $select->has_table_column( '', 'site_count' ) )
    {
      $application_join_site =
        'SELECT application_id, COUNT(*) AS site_count '.
        'FROM site '.
        'GROUP BY application_id';
      $modifier->left_join(
        sprintf( '( %s ) AS application_join_site', $application_join_site ),
        'application.id',
        'application_join_site.application_id' );
      $select->add_column( 'IFNULL( site_count, 0 )', 'site_count', false );
    }

    // add the total number of users
    if( $select->has_table_column( '', 'user_count' ) )
    {
      $application_join_user =
        'SELECT site.application_id, COUNT( DISTINCT user_id ) AS user_count '.
        'FROM access '.
        'JOIN site ON access.site_id = site.id '.
        'GROUP BY site.application_id';
      $modifier->left_join(
        sprintf( '( %s ) AS application_join_user', $application_join_user ),
        'application.id',
        'application_join_user.application_id' );
      $select->add_column( 'IFNULL( user_count, 0 )', 'user_count', false );
    }
  }
}
