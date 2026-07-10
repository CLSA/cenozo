CREATE TRIGGER study_phase_AFTER_INSERT AFTER INSERT ON study_phase FOR EACH ROW
BEGIN
  INSERT INTO study_phase_status (participant_id, study_phase_id)
  SELECT participant.id, NEW.id FROM participant;
END ;;
