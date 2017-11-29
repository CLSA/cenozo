<?php
/**
 * consent.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * consent: record
 */
class consent extends record
{
  /**
   * Overrides the parent save method.
   * @access public
   */
  public function save()
  {
    $new_record = is_null( $this->id );

    parent::save();

    // add a hold if the consent is a new participation consent
    if( $new_record )
    {
      $db_consent_type = lib::create( 'database\consent_type', $this->consent_type_id );
      if( 'participation' == $db_consent_type->name )
      {
        $hold_class_name = lib::get_class_name( 'database\hold' );
        $hold_class_name::add_withdrawn_hold( $this );
      }
    }
  }

  /**
   * Returns a string representation of the consent (eg: verbal deny, written accept, etc)
   * @return string
   * @access public
   */
  public function to_string()
  {
    return sprintf( '%s %s %s',
                    $this->get_consent_type()->name,
                    $this->written ? 'written' : 'verbal',
                    $this->accept ? 'accept' : 'deny' );
  }
}
