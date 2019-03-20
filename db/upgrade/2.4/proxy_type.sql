SELECT "Changing proxy-type names" AS "";

DELETE FROM proxy_type WHERE name = "initiated, information provider only";
UPDATE proxy_type SET name = "follow up required, central" WHERE name = "contact required, central";
UPDATE proxy_type SET name = "ready to contact proxy" WHERE name = "initiated";
