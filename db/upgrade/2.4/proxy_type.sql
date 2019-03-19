SELECT "Removing the now defunct \"initiated, information provider only\" proxy type" AS "";

DELETE FROM proxy_type WHERE name = "initiated, information provider only";
