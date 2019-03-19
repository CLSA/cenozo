SELECT "Making proxy initiation script non-repeatable" AS "";

UPDATE script SET repeated = 0 WHERE name = "Master Proxy Initiation";
