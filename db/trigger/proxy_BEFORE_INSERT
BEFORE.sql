CREATE TRIGGER proxy_BEFORE_INSERT
BEFORE INSERT ON proxy FOR EACH ROW
BEING
  SET @proxy_type = NULL;
  SELECT proxy_type.name INTO @proxy_type
  FROM proxy_type
  WHERE id = NEW.proxy_type_id;