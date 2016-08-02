<?php
/**
 * form_query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * A special class used by records with associations to forms
 */
class form_query extends query
{
  /**
   * Override parent method
   */
  public function get_leaf_parent_relationship()
  {
    $relationship_class_name = lib::get_class_name( 'database\relationship' );
    return $relationship_class_name::ONE_TO_MANY;
  }

  /**
   * Override parent method
   */
  public function get_record_count()
  {
    $form_class_name = lib::create( 'database\form' );

    $modifier = clone $this->modifier;
    $modifier->join( 'form_association', 'form.id', 'form_association.form_id' );
    $modifier->where( 'form_association.subject', '=', $this->get_parent_subject() );
    $modifier->where( 'form_association.record_id', '=', $this->get_parent_record()->id );

    // find aliases in the select and translate them in the modifier
    $this->select->apply_aliases_to_modifier( $modifier );

    return $form_class_name::count( $modifier );
  }

  /**
   * Override parent method
   */
  public function get_record_list()
  {
    $form_class_name = lib::create( 'database\form' );

    $modifier = clone $this->modifier;
    $modifier->join( 'form_association', 'form.id', 'form_association.form_id' );
    $modifier->where( 'form_association.subject', '=', $this->get_parent_subject() );
    $modifier->where( 'form_association.record_id', '=', $this->get_parent_record()->id );

    // find aliases in the select and translate them in the modifier
    $this->select->apply_aliases_to_modifier( $modifier );

    return $form_class_name::select( $this->select, $modifier );
  }
}
