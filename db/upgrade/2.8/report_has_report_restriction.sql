SELECT "Adding missing unique key to report_has_report_restriction table" AS "";

ALTER TABLE report_has_report_restriction
ADD UNIQUE KEY uq_report_id_report_has_report_restriction_id ( report_id, report_restriction_id );
