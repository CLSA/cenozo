DELETE FROM state;
INSERT INTO state ( name, rank, description ) VALUES
( "deceased", 1, "The participant is deceased." ),
( "deaf", 2, "The participant is deaf." ),
( "mentally unfit", 3, "The participant is mentally unfit." ),
( "language barrier", 4, "The participant does not adequately speak one of the study's languages." ),
( "age range", 5, "The participant falls outside of the age range criteria." ),
( "not canadian", 6, "The participant is not Canadian." ),
( "federal reserve", 7, "The participant's residence is on a federal reserve." ),
( "armed forces", 8, "The participant is a member of the armed forces or is a veteran." ),
( "institutionalized", 9, "The participant is institutionalized." ),
( "noncompliant", 10, "The participant is unable to comply with the study's policies." ),
( "sourcing required", 11, "Unable to reach the participant, further sourcing is required." ),
( "unreachable", 12, "Unable to reach the participant even after sourcing." ),
( "consent unavailable", 13, "Unable to receive written consent from the participant." ),
( "duplicate", 14, "The participant already exists under a different record." ),
( "other", 15, "Other state." );
